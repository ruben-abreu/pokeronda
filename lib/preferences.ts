import { normalizePlace, type EventKind } from './events';
export type Preferences = { game:'all'|'TCG'|'VGC'; kinds:EventKind[]; district:string; districts:string[]; theme:'light'|'dark'; language:'pt'|'en' };
export const PREFERENCES_KEY='proxima-ronda.preferences.v1';
export function kindsForGame(game:string,kinds:string[]):EventKind[]{return [...new Set(kinds)].filter((kind):kind is EventKind=>['challenge','cup','prerelease'].includes(kind)&&(game!=='VGC'||kind!=='prerelease'));}
export function readPreferences(raw:string|null,systemDark=false):Preferences {
 const defaults:Preferences={game:'TCG',kinds:[],district:'Lisboa',districts:['Lisboa'],theme:systemDark?'dark':'light',language:'pt'};
 if(!raw)return defaults;
 try{const value=JSON.parse(raw);if(!value||typeof value!=='object')return defaults;
 const districts=Array.isArray(value.districts)?[...new Set<string>(value.districts.filter((d:unknown):d is string=>typeof d==='string'&&!!d.trim()&&d!=='all').map((d:string)=>normalizePlace(d)))]:typeof value.district==='string'&&value.district.trim()&&value.district!=='all'?[normalizePlace(value.district)]:[];
 const game=['all','TCG','VGC'].includes(value.game)?value.game:'all';
 return {districts,language:value.language==='en'?'en':'pt',game,kinds:kindsForGame(game,Array.isArray(value.kinds)?value.kinds:[]),district:typeof value.district==='string'&&value.district.trim()?normalizePlace(value.district):'all',theme:['light','dark'].includes(value.theme)?value.theme:defaults.theme};
 }catch{return defaults;}
}
