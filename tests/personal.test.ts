import assert from 'node:assert/strict';
import {test} from 'node:test';
import {shopKey,eventKey,shopOptions,readPersonal,personalFilter,monthOpen} from '../lib/personal.ts';
import {filterEvents,type Tournament} from '../lib/events.ts';
const event:Tournament={id:'one',url:'https://www.pokemon.com/us/26-09-000001',shop:'Loja TCG',district:'Lisboa',city:'Lisboa',address:'Rua A',kind:'cup',game:'TCG',date:'2026-09-20',time:'15:00',name:'Cup',price:'',timezone:'Europe/Lisbon'};
const second={...event,id:'two',url:'',district:'Porto',city:'Porto',address:'Rua B'};
test('Store choices follow district and distinguish branches',()=>{
 assert.equal(shopOptions([event,event,second],'Lisboa').length,1);
 assert.equal(shopOptions([event,second],'all').length,2);
 assert.notEqual(shopKey(event),shopKey(second));
 assert.equal(shopKey(event),shopKey({...event,shop:' LOJA TCG ',city:'LISBOA'}));
});
test('Favorites survive storage serialization and preserve official event identity',()=>{
 const p={shop:shopKey(event),events:[eventKey(event)],shops:shopOptions([event],'Lisboa'),months:{'2026-09':false}};
 const restored=readPersonal(JSON.stringify(p));assert.deepEqual(restored,p);
 assert.equal(personalFilter([{...event,id:'changed-guid'},second],'all','saved',restored).length,1);
 assert.equal(personalFilter([event,second],'all','shops',restored).length,1);
 assert.equal(personalFilter([event,second],shopKey(second),'saved',restored).length,0);
});
test('Favorites do not bypass date, game or friendlies opt-in',()=>{
 const friendly={...event,id:'casual',url:'',kind:'friendly'} as Tournament;
 const p=readPersonal(null);p.events=[eventKey(friendly)];p.shops=shopOptions([friendly],'all');
 assert.equal(personalFilter(filterEvents([friendly],'TCG',[],'all','2026-09-07'),'all','saved',p).length,0);
 assert.equal(personalFilter(filterEvents([friendly],'TCG',[],'all','2026-09-07',true),'all','saved',p).length,1);
 assert.equal(personalFilter(filterEvents([event],'VGC',[],'all','2026-09-07'),'all','shops',p).length,0);
});
test('Corrupt local storage is safe and malformed records are discarded',()=>{
 assert.deepEqual(readPersonal('{bad'),readPersonal(null));
 assert.deepEqual(readPersonal(JSON.stringify({events:[null,'a','a',3],shops:[null,{}],months:{bad:true,'2026-10':'yes','2026-09':false}})),{shop:'all',events:['a'],shops:[],months:{'2026-09':false}});
});
test('Mobile opens first matching month; explicit choices survive filter changes',()=>{
 assert.equal(monthOpen('2026-09','2026-09',true,{}),true);
 assert.equal(monthOpen('2026-10','2026-09',true,{}),false);
 assert.equal(monthOpen('2026-10','2026-10',true,{}),true);
 assert.equal(monthOpen('2026-10','2026-09',false,{}),true);
 assert.equal(monthOpen('2026-10','2026-10',true,{'2026-10':false}),false);
});

test('Reviewed source aliases merge stores while preserving distinct branches and events',()=>{
 const lisboa={...event,shop:'Versus Gamecenter',address:'C R. CONSELHEIRO LOPO VAZ, LISBOA, LISBOA 1800-142, PT'};
 const variant={...lisboa,id:'variant',url:'other-event',shop:'Versus Gamecenter Lisboa',address:'R. CONSELHEIRO LOPO VAZ LOTE C LOJA A, 1800-142 LISBOA, PORTUGAL'};
 const alges={...event,shop:'Versus Gamecenter Algés',city:'Oeiras',address:'AV. BOMBEIROS VOLUNTÁRIOS DE ALGÉS 68B, 1495-023 ALGÉS, PORTUGAL'};
 assert.equal(shopKey(lisboa),shopKey(variant));
 assert.notEqual(shopKey(lisboa),shopKey(alges));
 assert.equal(shopOptions([lisboa,variant,alges],'Lisboa').length,2);
 assert.equal(shopOptions([variant,lisboa],'Lisboa')[0].name,'Versus Gamecenter Lisboa');
 const oldKey=JSON.stringify([variant.shop,variant.district,variant.city,variant.address].map(s=>s.normalize('NFD').replace(/\p{M}/gu,'').trim().replace(/\s+/g,' ').toLowerCase()));
 const restored=readPersonal(JSON.stringify({shop:oldKey,shops:[{key:oldKey,name:variant.shop,district:variant.district,city:variant.city},...shopOptions([lisboa],'all')]}));
 assert.equal(restored.shop,shopKey(lisboa));
 assert.equal(restored.shops.length,1);
 assert.equal(personalFilter([lisboa,variant,alges],restored.shop,'shops',restored).length,2);
 assert.notEqual(shopKey(event),shopKey({...event,address:'Rua B'}));
});

test('Templars Lisboa aliases merge without including Torres Novas',()=>{
 const lisboa={...event,city:'Rio de Mouro',shop:'Templars Arena Lisboa',address:'URBANIZAÇÃO UNIVERSIDADE CATÓLICA PORTUGUESA Nº 30, 2635-001 RIO DE MOURO, PORTUGAL'};
 const alias={...lisboa,shop:'Templars Arena Gamecenter (Lisboa)',address:'URBANIZAÇÃO UNIVERSIDADE CATÓLICA LOTE 30 BLOCO D,R/C A - FRAÇÃO AB, 2635-631 RIO DE MOURO, PORTUGAL'};
 const torres={...event,shop:'Templars Arena Gamecenter',city:'Torres Novas',district:'Santarém',address:'LARGO DO COMÉRCIO 3B, 2350-213 PARCEIROS DE IGREJA, PORTUGAL'};
 assert.equal(shopKey(lisboa),shopKey(alias));
 assert.notEqual(shopKey(lisboa),shopKey(torres));
 assert.equal(shopOptions([lisboa,alias,torres],'all').length,2);
});
