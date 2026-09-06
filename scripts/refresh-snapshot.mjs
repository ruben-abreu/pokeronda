import {writeFile} from 'node:fs/promises';
const events=[];
for(let page=0;page<20;page++){
 const response=await fetch('https://www.pokedata.ovh/events/tableapi/index_table.php',{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json; charset=UTF-8'},body:JSON.stringify({past:'',country:'PT',city:'',shop:'',league:'',states:'[]',postcode:'',cups:'1',challenges:'1',vcups:'1',vchallenges:'1',prereleases:'1',premier:'',go:'',gocup:'',mss:'',ftcg:'1',fvg:'1',fgo:'',latitude:'',longitude:'',radius:'',unit:'km',width:1400,page}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 const rows=await response.json();if(!Array.isArray(rows)||rows.some(r=>r.country_code!=='PT'||!r.guid))throw new Error('Invalid source');events.push(...rows);
 if(rows.length<100){await writeFile('lib/snapshot.json',JSON.stringify({fetchedAt:new Date().toISOString(),events}));console.log(JSON.stringify({total:events.length,types:events.reduce((a,e)=>(a[e.type]=(a[e.type]||0)+1,a),{})}));process.exit(0);}
}
throw new Error('Incomplete source');
