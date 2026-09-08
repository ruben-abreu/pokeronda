import { normalizeEvents, type Feed } from './events';
const CACHE = 'proxima-ronda-events-v1';
const KEY = '/api/events'; // Retain the existing PWA's last successful list on upgrade.
function validFeed(value: unknown): value is Feed {
  const feed = value as Feed | null;
  return !!feed && Array.isArray(feed.events) && Number.isFinite(Date.parse(feed.fetchedAt));
}
async function savedFeed(): Promise<Feed | undefined> {
  try {
    const saved = await (await caches.open(CACHE)).match(KEY);
    if (saved) { const feed: unknown = await saved.json(); if (validFeed(feed)) return feed; }
  } catch { /* Private browsing or storage restrictions must not prevent live updates. */ }
}
export async function loadBrowserFeed(): Promise<Feed> {
  try {
    const rows: unknown[] = [];
    let batch = '';
    let fetchedAt = '';
    const signal = AbortSignal.timeout(45000);
    for (let page = 0; page < 20; page++) {
      const response = await fetch(`/api/source-events?page=${page}${batch ? `&batch=${batch}` : ''}`, { cache: 'no-store', signal });
      if (!response.ok) throw new Error('Source unavailable');
      const date = response.headers.get('X-PokeRonda-Fetched-At') || '';
      if (!Number.isFinite(Date.parse(date))) throw new Error('Invalid freshness');
      if (!fetchedAt || Date.parse(date) < Date.parse(fetchedAt)) fetchedAt = date;
      const pageBatch = response.headers.get('X-PokeRonda-Batch') || '';
      if (!/^\d+$/.test(pageBatch) || (batch && pageBatch !== batch)) throw new Error('Invalid batch');
      batch = pageBatch;
      const items: unknown = await response.json();
      if (!Array.isArray(items) || items.length > 100 || items.some(row => !row || typeof row !== 'object' || typeof row.guid !== 'string' || typeof row.type !== 'string' || typeof row.date !== 'string' || row.country_code !== 'PT'))
        throw new Error('Invalid source data');
      rows.push(...items);
      if (items.length < 100) {
        const feed: Feed = { events: normalizeEvents(rows), fetchedAt, stale: false };
        try { await (await caches.open(CACHE)).put(KEY, Response.json(feed)); } catch { /* Storage is optional. */ }
        return feed;
      }
    }
    throw new Error('Incomplete event list');
  } catch (error) {
    const saved = await savedFeed();
    if (saved) return { ...saved, stale: true };
    throw error;
  }
}
