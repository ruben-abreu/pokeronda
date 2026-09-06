import snapshot from './snapshot.json';
import { normalizeEvents, type Feed } from './events';
const TTL = 6 * 60 * 60 * 1000;
let memory: Feed | undefined;
let pending: Promise<Feed> | undefined;
let retryAfter = 0;
const fallback: Feed = { events: normalizeEvents(snapshot.events), fetchedAt: snapshot.fetchedAt, stale: true };
function edgeCache(): Cache | undefined { return typeof caches === 'undefined' ? undefined : (caches as CacheStorage & {default?:Cache}).default; }
const cacheKey = 'https://proxima-ronda-pt.abreu90.chatgpt.site/internal/portugal-feed-v4';
export async function getFeed(): Promise<Feed> {
 if (memory && Date.now()-Date.parse(memory.fetchedAt)<TTL && !memory.stale) return memory;
 if (Date.now()<retryAfter) return {...(memory||fallback),stale:true};
 if (pending) return pending;
 pending = refreshFeed().finally(()=>{pending=undefined;});
 return pending;
}
async function refreshFeed(): Promise<Feed> {
 const cache=edgeCache(); let saved:Feed|undefined;
 try { const r=await cache?.match(cacheKey); if(r){ saved=await r.json() as Feed; if(Date.now()-Date.parse(saved.fetchedAt)<TTL){ memory={...saved,stale:false}; return memory; } } }catch{}
 try {
  const rows:unknown[]=[];
  const deadline=AbortSignal.timeout(45000);
  let complete=false;
  for(let page=0;page<20;page++) {
   const response=await fetch('https://www.pokedata.ovh/events/tableapi/index_table.php', {method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json; charset=UTF-8'},body:JSON.stringify({past:'',country:'PT',city:'',shop:'',league:'',states:'[]',postcode:'',cups:'1',challenges:'1',vcups:'1',vchallenges:'1',prereleases:'1',premier:'',go:'',gocup:'',mss:'',ftcg:'1',fvg:'1',fgo:'',latitude:'',longitude:'',radius:'',unit:'km',width:1400,page}),signal:deadline});
   if(!response.ok)throw new Error('Fonte indisponível');
   const pageRows:unknown=await response.json();
   if(!Array.isArray(pageRows))throw new Error('Resposta inválida');
   if(pageRows.some(r=>!r || typeof r!=='object' || typeof r.guid!=='string' || typeof r.type!=='string' || typeof r.date!=='string' || r.country_code!=='PT')) throw new Error('Dados inválidos');
   rows.push(...pageRows);
   if(pageRows.length<100){complete=true;break;}
  }
  if(!complete)throw new Error('Lista incompleta');
  memory={events:normalizeEvents(rows),fetchedAt:new Date().toISOString(),stale:false};
  // Keep the last successful response longer than its freshness window for outages.
  try {await cache?.put(cacheKey,new Response(JSON.stringify(memory),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=604800'}}));}catch{}
  return memory;
 }catch{
  retryAfter=Date.now()+60000;
  return {...(memory||saved||fallback),stale:true};
 }
}
