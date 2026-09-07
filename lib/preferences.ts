import { normalizePlace, type EventKind } from './events';
export type Preferences = { game:'all'|'TCG'|'VGC'; kinds:EventKind[]; district:string; theme:'light'|'dark'; language:'pt'|'en' };
export const PREFERENCES_KEY='proxima-ronda.preferences.v1';
export function kindsForGame(game:string,kinds:string[]):EventKind[]{return [...new Set(kinds)].filter((kind):kind is EventKind=>['challenge','cup','prerelease'].includes(kind)&&(game!=='VGC'||kind!=='prerelease'));}
export function readPreferences(raw:string|null,systemDark=false):Preferences {
 const defaults:Preferences={game:'TCG',kinds:[],district:'Lisboa',theme:systemDark?'dark':'light',language:'pt'};
 if(!raw)return defaults;
 try{const value=JSON.parse(raw);if(!value||typeof value!=='object')return defaults;
 const game=['all','TCG','VGC'].includes(value.game)?value.game:'all';
 return {language:value.language==='en'?'en':'pt',game,kinds:kindsForGame(game,Array.isArray(value.kinds)?value.kinds:[]),district:typeof value.district==='string'&&value.district.trim()?normalizePlace(value.district):'all',theme:['light','dark'].includes(value.theme)?value.theme:defaults.theme};
 }catch{return defaults;}
}
