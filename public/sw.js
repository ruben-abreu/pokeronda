/* Build replaces these values with the version and complete static asset list. */
const VERSION = '__PWA_VERSION__';
const ASSETS = __PWA_ASSETS__;
const PREFIX = 'proxima-ronda-';
const STATIC = PREFIX + VERSION;
const DATA = PREFIX + 'events-v1';
self.addEventListener('install', event => {
 event.waitUntil((async()=>{
  const cache = await caches.open(STATIC);
  await cache.addAll(ASSETS);
  const response = await fetch('/', { cache: 'reload' });
  if (!response.ok || response.redirected || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Invalid app shell');
  await cache.put('/', response);
 })());
});
self.addEventListener('activate', event => {
 event.waitUntil((async()=>{
  for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== STATIC && key !== DATA) await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 if (request.method !== 'GET' || url.origin !== self.location.origin) return;
 // The feed loader saves only complete, validated lists, never partial source pages.
 if (url.pathname.startsWith('/api/')) return;
 if (request.mode === 'navigate' && url.pathname === '/') {
  event.respondWith((async()=>{
   const cache = await caches.open(STATIC);
   try {
    const response = await fetch(request);
    if (!response.ok || response.redirected || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Unavailable');
    await cache.put('/', response.clone());
    return response;
   } catch { return (await cache.match('/')) || (await cache.match('/offline.html')) || new Response('Sem ligação', { status: 503 }); }
  })());
  return;
 }
 if (ASSETS.includes(url.pathname)) event.respondWith((async()=>{
  return (await (await caches.open(STATIC)).match(url.pathname)) || fetch(request);
 })());
});
