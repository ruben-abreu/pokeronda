import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { normalizeEvents } from '../lib/events.ts';
import { calendarFile } from '../lib/calendar.ts';
const snapshot = JSON.parse(await readFile('lib/snapshot.json', 'utf8'));
const feed = { events: normalizeEvents(snapshot.events), fetchedAt: snapshot.fetchedAt, stale: true };
await mkdir('public/data', { recursive: true });
await writeFile('public/data/fallback.json', JSON.stringify(feed));
await mkdir('public/calendars', { recursive: true });
await Promise.all(feed.events.filter(event => /^[a-zA-Z0-9-]{1,80}$/.test(event.id)).map(event =>
  writeFile(`public/calendars/${event.id}.ics`, calendarFile(event, new Date(snapshot.fetchedAt)))));
console.log(`Prepared ${feed.events.length} fallback events at build time.`);

// Vinext's generated redirect must not send a subsequent deploy to the obsolete SSR build.
try {
 const path = '.wrangler/deploy/config.json';
 const redirect = JSON.parse(await readFile(path, 'utf8'));
 if (redirect.configPath === '../../dist/server/wrangler.json') await rm(path);
} catch (error) { if (error.code !== 'ENOENT') throw error; }
