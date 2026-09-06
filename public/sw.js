/* Build replaces these values with the version and complete static asset list. */
const VERSION = '__PWA_VERSION__';
const ASSETS = __PWA_ASSETS__;
const PREFIX = 'proxima-ronda-';
const STATIC = PREFIX + VERSION;
const DATA = PREFIX + 'events-v1';
const validFeed = value => value && Array.isArray(value.events) && Number.isFinite(Date.parse(value.fetchedAt)) && typeof value.stale === 'boolean';
self.addEventListener('install', event => {
 event.waitUntil((async()=>{
  const cache=await caches.open(STATIC);
  await cache.addAll(ASSETS);
  try{const response=await fetch('/',{cache:'reload'});if(response.ok&&!response.redirected&&response.headers.get('content-type')?.includes('text/html'))await cache.put('/',response);}catch{}
  try{const response=await fetch('/api/events',{cache:'no-store'});if(response.ok){const feed=await response.clone().json();if(validFeed(feed)&&!feed.stale)await(await caches.open(DATA)).put('/api/events',response);}}catch{}
 })());
});
self.addEventListener('activate', event => {
 event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==STATIC&&key!==DATA)await caches.delete(key);await self.clients.claim();})());
});
self.addEventListener('fetch', event => {
 const request=event.request;const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname==='/api/events'){
  event.respondWith((async()=>{
   const cache=await caches.open(DATA);
   try{
    const response=await fetch(request);
    if(!response.ok)throw new Error('Source unavailable');
    const feed=await response.clone().json();if(!validFeed(feed))throw new Error('Invalid feed');
    if(!feed.stale)await cache.put('/api/events',response.clone());
    else{const saved=await cache.match('/api/events');if(saved){const previous=await saved.json();if(validFeed(previous)&&Date.parse(previous.fetchedAt)>Date.parse(feed.fetchedAt))return Response.json({...previous,stale:true});}}
    return response;
   }catch{const saved=await cache.match('/api/events');if(saved){const feed=await saved.json();return Response.json({...feed,stale:true});}return Response.json({error:'Sem lista guardada'},{status:503});}
  })());return;
 }
 if(request.mode==='navigate'&&url.pathname==='/'){
  event.respondWith((async()=>{const cache=await caches.open(STATIC);try{const response=await fetch(request);if(!response.ok)throw new Error('Unavailable');if(!response.redirected&&response.headers.get('content-type')?.includes('text/html'))await cache.put('/',response.clone());return response;}catch{return (await cache.match('/'))||(await cache.match('/offline.html'))||new Response('Sem ligação',{status:503});}})());return;
 }
 if(ASSETS.includes(url.pathname))event.respondWith((async()=>{const cache=await caches.open(STATIC);return(await cache.match(url.pathname))||fetch(request);})());
});
