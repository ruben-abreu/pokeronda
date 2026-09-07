export type Game = 'TCG' | 'VGC';
export type EventKind = 'challenge' | 'cup' | 'prerelease' | 'friendly';
export interface Tournament { id: string; game: Game; kind: EventKind; name: string; date: string; time: string; shop: string; district: string; city: string; address: string; url: string; timezone: string; price: string; }
export interface Feed { events: Tournament[]; fetchedAt: string; stale: boolean; }
export const kindLabels: Record<EventKind,string> = { challenge: 'League Challenge', cup: 'League Cup', prerelease: 'Pré-release', friendly: 'Friendly' };
const places: Record<string,string> = { 'Lisbon':'Lisboa', 'Evora':'Évora', 'Setubal':'Setúbal', 'Santarem':'Santarém', 'Braganca':'Bragança', 'Guimaraes':'Guimarães', 'Portimao':'Portimão', 'Povoa de Varzim':'Póvoa de Varzim', 'Pacos de Ferreira':'Paços de Ferreira', 'Vila Nova de Famalicao':'Vila Nova de Famalicão' };
export function normalizePlace(value:string) {
 const trimmed=value.trim().replace(/\s+/g,' ');
 const key=Object.keys(places).find(k=>k.toLocaleLowerCase('pt')===trimmed.toLocaleLowerCase('pt'));
 return key?places[key]:cleanName(trimmed);
}
export function admissionPrice(value:unknown):string {
 if(typeof value!=='string'&&typeof value!=='number')return '';
 const raw=String(value).trim();
 if(!raw||/^(n\/?a|não indicado|a confirmar|ask staff|tba|tbd|-)$/i.test(raw))return '';
 const numeric=raw.replace(/€|EUR/gi,'').trim();
 if(/^\d+(?:[.,]\d{1,2})?$/.test(numeric))return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(Number(numeric.replace(',','.')));
 return raw;
}
export function cleanName(s:string) { return s === s.toUpperCase() ? s.toLocaleLowerCase('pt-PT').replace(/(^|[\s(])\p{L}/gu, c=>c.toLocaleUpperCase('pt-PT')).replace(/\b(Tcg|Vgc|Bt|Gg)\b/g,c=>c.toUpperCase()) : s; }
export function normalizeEvents(rows: unknown[]): Tournament[] {
 const found = new Map<string,Tournament>();
 for (const row of rows) {
  if (!row || typeof row !== 'object') continue;
  const r = row as Record<string,unknown>;
  const s=(k:string)=>typeof r[k]==='string'? r[k] as string : '';
  const type=s('type');
  if (s('country_code')!=='PT' || /cancel/i.test(s('status'))) continue;
  const kind: EventKind|null = /^League Challenge(?: VG)?$/i.test(type)?'challenge':/^League Cup(?: VG)?$/i.test(type)?'cup':/^Pre[ -]?Release$/i.test(type)?'prerelease':/^nonpremier (?:TCG|VG)$/i.test(type)?'friendly':null;
  if (!kind || !/^\d{4}-\d{2}-\d{2}$/.test(s('date')) || !s('guid') || !s('shop')) continue;
  const game:Game=/ VG$/i.test(type)?'VGC':'TCG';
  const date=s('date');
  const time=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s('when'))?s('when').slice(11,16):'';
  let url=''; try { const u=new URL(s('pokemon_url')); if(u.protocol==='https:' && /(^|\.)pokemon\.com$/.test(u.hostname) && /\d{2}-\d{2}-\d{6}/.test(u.pathname)) url=u.href; }catch{}
  const district=normalizePlace(s('state'))||'Por indicar';
  const price=admissionPrice(r.admission)||admissionPrice(r.cost);
  const e:Tournament={price,id:s('guid'),game,kind,name:s('name')||kindLabels[kind],date,time,shop:cleanName(s('shop')),district,city:normalizePlace(s('city')),address:s('street_address'),url,timezone:/azores|açores|acores|ponta delgada|angra do heroismo|horta/i.test(s('state')+' '+s('city'))?'Atlantic/Azores':'Europe/Lisbon'};
  // Prefer the official tournament identifier; never merge different tournaments just because their times match.
  const key=url || e.id;
  if(!found.has(key)) found.set(key,e);
 }
 return [...found.values()].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)||a.shop.localeCompare(b.shop,'pt'));
}
export function todayPortugal(){ return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function filterEvents(events:Tournament[], game:string, kinds:string[], district:string, today:string, includeFriendlies=false) { return events.filter(e=>e.date>=today && (game==='all'||e.game===game) && (e.kind==='friendly'?includeFriendlies:(kinds.length===0||kinds.includes(e.kind))) && (district==='all'||e.district===district)); }
export function dateParts(date:string,locale='pt-PT') { const d=new Date(date+'T12:00:00Z');return {day:date.slice(8),month:new Intl.DateTimeFormat(locale,{month:'short',timeZone:'UTC'}).format(d).replace('.',''),weekday:new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'}).format(d).replace('.','')}; }
