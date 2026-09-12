import { matchesDistrict, type Tournament } from './events';
import aliases from './shop-aliases.json';
export const PERSONAL_KEY = 'pokeronda.personal.v1';
export type FavoriteShop = {key:string;name:string;district:string;city:string};
export type Personal = {shop:string;events:string[];shops:FavoriteShop[];months:Record<string,boolean>};
const normalized=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').trim().replace(/\s+/g,' ').toLowerCase();
// Reviewed source aliases only: unknown shops and separate branches retain their address identity.
const identities=new Map(aliases.flatMap(group=>{
 const key=JSON.stringify(group.aliases[0]);
 return group.aliases.map(alias=>[JSON.stringify(alias),{key,name:group.name}] as const);
}));
function shopIdentity(e:Pick<Tournament,'shop'|'district'|'city'|'address'>){
 const key=JSON.stringify([e.shop,e.district,e.city,e.address].map(normalized));
 return identities.get(key)||{key,name:e.shop};
}
export function shopKey(e:Pick<Tournament,'shop'|'district'|'city'|'address'>){return shopIdentity(e).key;}
function migrateShopKey(key:string){return identities.get(key)?.key||key;}

export function eventKey(e:Pick<Tournament,'url'|'id'>){return e.url||e.id;}
export function shopOptions(events:Tournament[],district:string|readonly string[]):FavoriteShop[]{
 const shops=new Map<string,FavoriteShop>();
 for(const e of events)if(matchesDistrict(e.district,district)){const key=shopKey(e);if(!shops.has(key))shops.set(key,{key,name:shopIdentity(e).name,district:e.district,city:e.city});}
 return [...shops.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt')||a.city.localeCompare(b.city,'pt'));
}
export function readPersonal(raw:string|null):Personal{
 const defaults:Personal={shop:'all',events:[],shops:[],months:{}};
 try{const p=JSON.parse(raw||'null');if(!p||typeof p!=='object')return defaults;
 const events=Array.isArray(p.events)?[...new Set<string>(p.events.filter((v:unknown)=>typeof v==='string'&&v.length<2048))]:[];
 const shops:FavoriteShop[]=Array.isArray(p.shops)?p.shops.filter((s:FavoriteShop)=>s&&['key','name','district','city'].every(k=>typeof s[k as keyof FavoriteShop]==='string')):[];
 const months:Record<string,boolean>={};if(p.months&&typeof p.months==='object')for(const [key,value] of Object.entries(p.months))if(/^\d{4}-\d{2}$/.test(key)&&typeof value==='boolean')months[key]=value;
 return{shop:typeof p.shop==='string'?migrateShopKey(p.shop):'all',events,shops:[...new Map(shops.map(s=>{const identity=identities.get(s.key);const migrated=identity?{...s,...identity}:s;return [migrated.key,migrated];})).values()],months};
 }catch{return defaults;}
}
export function personalFilter(events:Tournament[],shop:string,view:string,personal:Personal){return events.filter(e=>(shop==='all'||shopKey(e)===shop)&&(view==='saved'?personal.events.includes(eventKey(e)):view==='shops'?personal.shops.some(s=>s.key===shopKey(e)):true));}
export function monthOpen(month:string,first:string|undefined,mobile:boolean,overrides:Record<string,boolean>){return overrides[month]??(!mobile||month===first);}
