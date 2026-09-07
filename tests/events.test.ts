import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeEvents, filterEvents, type Tournament } from '../lib/events.ts';
import { calendarFile, startUTC, googleCalendarUrl } from '../lib/calendar.ts';
const row={guid:'abc-123',type:'League Challenge',country_code:'PT',date:'2026-09-12',when:'2026-09-12 15:00:00',shop:'ARENA PORTO',city:'Porto',state:'Porto',name:'Torneio Pokémon',pokemon_url:'https://www.pokemon.com/us/pokemon-trainer-club/play-pokemon-tournaments/26-09-005249/',street_address:'Rua da Loja, 10'};
const event=normalizeEvents([row])[0];
test('Only Portuguese TCG/VGC events; deduplicate by official ID',()=>{const data=normalizeEvents([row,{...row,guid:'duplicate'},{...row,type:'GO Challenge'},{...row,type:'nonpremier TCG'},{...row,country_code:'ES'},{...row,status:'cancelled'}]);assert.equal(data.length,1);assert.equal(data[0].game,'TCG');assert.equal(data[0].shop,'Arena Porto');});
test('Combined filters, future dates and empty prerelease results',()=>{const vgc={...event,id:'vgc',game:'VGC'} as Tournament;const cup={...event,id:'cup',kind:'cup'} as Tournament;assert.equal(filterEvents([event,vgc,cup],'VGC',['challenge'],'Porto','2026-09-12').length,1);assert.equal(filterEvents([event],'all',[],'all','2026-09-13').length,0);assert.equal(filterEvents([event],'TCG',['prerelease'],'all','2026-09-12').length,0);assert.equal(filterEvents([event,cup],'all',['challenge','cup'],'all','2026-09-12').length,2);});
test('Lisbon daylight saving and winter UTC conversion',()=>{assert.equal(startUTC(event).toISOString(),'2026-09-12T14:00:00.000Z');assert.equal(startUTC({...event,date:'2026-11-12'}).toISOString(),'2026-11-12T15:00:00.000Z');assert.equal(startUTC({...event,timezone:'Atlantic/Azores'}).toISOString(),'2026-09-12T15:00:00.000Z');});
test('ICS valid CRLF, escaping, UTF-8 folding, stable UID and explicit duration',()=>{const ics=calendarFile({...event,shop:'É'.repeat(80)+', Loja;\nTeste'},new Date('2026-09-06T00:00:00Z'));assert.ok(ics.includes('DTSTART:20260912T140000Z\r\n'));assert.ok(ics.includes('DTEND:20260912T150000Z\r\n'));assert.ok(ics.includes('UID:abc-123@proxima-ronda.pt'));assert.ok(ics.includes('\\, Loja\\;\\nTeste'));assert.ok(ics.endsWith('END:VCALENDAR\r\n'));for(const line of ics.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);});
test('Google links match ICS instants and preserve accented text',()=>{const url=new URL(googleCalendarUrl(event));assert.equal(url.hostname,'calendar.google.com');assert.equal(url.searchParams.get('dates'),'20260912T140000Z/20260912T150000Z');assert.match(url.searchParams.get('details')||'',/duração real/);});
test('Unknown time becomes all-day, including month boundary',()=>{const e={...event,time:'',date:'2026-09-30'};const ics=calendarFile(e);assert.ok(ics.includes('DTSTART;VALUE=DATE:20260930'));assert.ok(ics.includes('DTEND;VALUE=DATE:20261001'));assert.equal(new URL(googleCalendarUrl(e)).searchParams.get('dates'),'20260930/20261001');});
test('Reject foreign/unsafe event URLs',()=>{for(const url of ['javascript:alert(1)','https://pokemon.com.evil.test/26-09-123456','https://www.pokemon.com/us/tournaments//'])assert.equal(normalizeEvents([{...row,pokemon_url:url}])[0].url,'');});

test('Admission prices preserve zero, format euros and keep missing values empty',async()=>{
 const {admissionPrice}=await import('../lib/events.ts');
 assert.match(admissionPrice('6,5'),/6,50/);assert.match(admissionPrice('12€'),/12,00/);assert.match(admissionPrice(0),/0,00/);assert.equal(admissionPrice(''),'');assert.equal(admissionPrice(null),'');assert.equal(admissionPrice('Ask Staff'),'');assert.equal(admissionPrice('N/A'),'');assert.equal(admissionPrice('5€ juniors / 10€ masters'),'5€ juniors / 10€ masters');
 assert.match(normalizeEvents([{...row,admission:'4',cost:'8'}])[0].price,/4,00/);
});
test('Lisbon and Lisboa share one district and one combined result set',()=>{
 const result=normalizeEvents([{...row,state:'Lisbon'},{...row,guid:'second',pokemon_url:'',state:' LISBOA '}]);
 assert.deepEqual([...new Set(result.map(e=>e.district))],['Lisboa']);assert.equal(filterEvents(result,'all',[],'Lisboa','2026-09-12').length,2);
});
test('Saved filters restore safely and VGC cannot retain prerelease',async()=>{
 const {readPreferences,kindsForGame}=await import('../lib/preferences.ts');
 const saved={game:'TCG',kinds:['cup'],district:'Lisboa',theme:'dark',language:'pt'};
 assert.deepEqual(readPreferences(JSON.stringify(saved)),saved);
 assert.deepEqual(readPreferences(JSON.stringify({...saved,game:'VGC',kinds:['prerelease','cup'],district:'Lisbon'})),{...saved,game:'VGC',kinds:['cup']});
 assert.deepEqual(kindsForGame('VGC',['prerelease']),[]);
 assert.equal(readPreferences('{bad json',true).theme,'dark');
 assert.equal(readPreferences(JSON.stringify({game:'GO',kinds:['other']})).game,'all');
});

test('Friendlies require separate opt-in even with All, while game and district still apply',()=>{
 const casual=normalizeEvents([{...row,guid:'friendly-tcg',pokemon_url:'',type:'nonpremier TCG'},{...row,guid:'friendly-vgc',pokemon_url:'',type:'nonpremier VG'},{...row,guid:'friendly-go',pokemon_url:'',type:'nonpremier GO'}]);
 assert.equal(casual.length,2);assert.deepEqual(casual.map(e=>e.kind),['friendly','friendly']);assert.equal(casual[1].game,'VGC');
 const data=[event,...casual];
 assert.equal(filterEvents(data,'all',[],'all','2026-09-12').length,1);
 assert.equal(filterEvents(data,'all',[],'all','2026-09-12',true).length,3);
 assert.equal(filterEvents(data,'VGC',['cup'],'Porto','2026-09-12',true).length,1);
 assert.equal(filterEvents(data,'VGC',['cup'],'Lisboa','2026-09-12',true).length,0);
 assert.equal(filterEvents(data,'all',['friendly'],'all','2026-09-12').length,0);
});


test('First visit starts with TCG and Lisboa, saved choices and language win',async()=>{
 const {readPreferences}=await import('../lib/preferences.ts');
 assert.deepEqual(readPreferences(null),{game:'TCG',kinds:[],district:'Lisboa',theme:'light',language:'pt'});
 const saved={game:'all',kinds:[],district:'all',theme:'light',language:'en'};
 assert.deepEqual(readPreferences(JSON.stringify(saved)),saved);
 assert.equal(readPreferences(JSON.stringify({game:'VGC',district:'Porto'})).game,'VGC');
 assert.equal(readPreferences(JSON.stringify({game:'VGC',district:'Porto'})).district,'Porto');
});
