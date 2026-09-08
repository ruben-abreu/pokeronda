interface Env { ASSETS: Fetcher }
const SIX_HOURS = 6 * 60 * 60 * 1000;
const SOURCE = 'https://www.pokedata.ovh/events/tableapi/index_table.php';
const query = { past:'', country:'PT', city:'', shop:'', league:'', states:'[]', postcode:'', cups:'1', challenges:'1', vcups:'1', vchallenges:'1', prereleases:'1', premier:'', go:'', gocup:'', mss:'', ftcg:'1', fvg:'1', fgo:'', latitude:'', longitude:'', radius:'', unit:'km', width:1400 };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD')
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });

    // Transitional URLs for previously installed PWAs. These files are made at build time.
    if (url.pathname === '/api/events') {
      url.pathname = '/data/fallback.json'; url.search = '';
      return env.ASSETS.fetch(new Request(url, request));
    }
    const calendar = /^\/api\/calendar\/([a-zA-Z0-9-]{1,80})\.ics$/.exec(url.pathname);
    if (calendar) {
      url.pathname = '/calendars/' + calendar[1] + '.ics'; url.search = '';
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname !== '/api/source-events')
      return new Response('Not found', { status: 404 });

    const pageText = url.searchParams.get('page') ?? '0';
    if (!/^(?:[0-9]|1[0-9])$/.test(pageText)) return new Response('Invalid page', { status: 400 });
    const currentBatch = Math.floor(Date.now() / SIX_HOURS);
    const batchText = url.searchParams.get('batch');
    const batch = batchText === null ? currentBatch : Number(batchText);
    // Pin a complete pagination run to one six-hour window, including across a boundary.
    if (!Number.isInteger(batch) || (batch !== currentBatch && batch !== currentBatch - 1))
      return new Response('Refresh the event list', { status: 409 });
    const key = new Request(`${url.origin}/internal/source-v1/${batch}/${pageText}`);
    const cache = (caches as CacheStorage & { default: Cache }).default;
    let saved: Response | undefined;
    try { saved = await cache.match(key); } catch { /* Source remains available without cache. */ }
    if (saved) return request.method === 'HEAD' ? new Response(null, saved) : saved;

    try {
      const upstream = await fetch(SOURCE, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ ...query, page: Number(pageText) }), signal: AbortSignal.timeout(15000),
      });
      if (!upstream.ok) { await upstream.body?.cancel(); throw new Error('Source unavailable'); }
      // Deliberately stream bytes: no JSON parsing, normalization, sorting, React or Intl here.
      const response = new Response(upstream.body, { headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=21600',
        'X-Content-Type-Options': 'nosniff',
        'X-PokeRonda-Fetched-At': new Date().toISOString(),
        'X-PokeRonda-Batch': String(batch),
      } });
      ctx.waitUntil(cache.put(key, response.clone()).catch(() => {}));
      return request.method === 'HEAD' ? new Response(null, response) : response;
    } catch {
      const failure = new Response('Source temporarily unavailable', {
        status: 503, headers: { 'Cache-Control': 'public, max-age=60', 'Retry-After': '60' },
      });
      ctx.waitUntil(cache.put(key, failure.clone()).catch(() => {}));
      return failure;
    }
  },
} satisfies ExportedHandler<Env>;
