# PokeRonda

A responsive Pokémon event calendar for players in Portugal. PokeRonda brings upcoming TCG and VGC events into one place, with clear filters, admission prices and calendar exports.

Built as an independent community and portfolio project. The interface supports European Portuguese and English. The public app is [app.pokeronda.workers.dev](https://app.pokeronda.workers.dev/).

## Features

- **Searchable store filter** scoped to the selected district. Changing district resets the store selection.
- **Saved events and favorite stores** stored locally in this browser, without accounts. Dedicated views respect the current filters and show upcoming events available in the feed. Clearing browser data removes these favorites; they do not sync across devices.
- **Collapsible months** with expand/collapse-all actions. On mobile, only the first matching month opens by default. Explicit month choices are remembered locally.
- **TCG and VGC filters**, with League Challenges, League Cups and prereleases. Prereleases are only available for TCG.
- **Optional friendlies** through a separate checkbox. They are off on every page load, including after a refresh. “All” never enables them. When enabled, they supplement the selected competitive categories while respecting the game and district filters.
- **Events grouped by month and ordered by date**, showing the store, district, location, time and admission price. Missing prices appear as `N/A`.
- **Live result counts** that reflect the current filters.
- **Saved preferences** for game, event categories, district and light/dark theme, using browser local storage.
- **Calendar exports** for Apple Calendar, Google Calendar and other apps that support `.ics` files.
- **Mobile PWA support**, including installation guidance and offline access to previously cached events in production.
- **Discreet footer actions** for optional Ko-fi support and improvement suggestions. Feedback opens the user's email app with a prepared message; it is not sent automatically.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui with Base UI primitives, and Lucide icons. The interface is served as static assets, with no React rendering in the Worker. A small Worker streams cached source pages. The browser validates and normalizes events, generates calendars and saves the last complete list for offline use.

The current app does not require a database, user accounts or an email delivery service.

## Run locally

Use Node.js **22.22 or later in the Node 22 release line**; 22.22 was validated for this project. On macOS, keep the project in a fully downloaded local folder rather than an iCloud folder with storage optimization enabled.

```sh
npm ci
npm run dev
```

Open the URL printed by the development server, normally [http://localhost:3000](http://localhost:3000).

To preview the production build locally:

```sh
npm run build
npm run start
```

Use the address printed by Wrangler. `npm run start` runs a local production preview; it does not publish the app.

## Data source and freshness

Events currently come from the endpoint used by [pokedata.ovh](https://www.pokedata.ovh/events/), filtered to Portugal. This is separate from the service at `pokedata.io`.

The browser checks for updates on launch, when the page becomes visible, and every 30 minutes while visible. Source pages are cached in six-hour windows per Cloudflare location. Pagination stays within one window. Each Worker invocation streams one page without parsing JSON, sorting events, formatting dates or generating HTML. Failures have a short retry delay.

Only complete, validated event lists are saved in the browser. Failed refreshes preserve the last complete list, marked as stale. A build-time snapshot covers first visits during an outage. No scheduled polling runs while nobody is using the app. Older installed PWAs receive the static fallback at `/api/events` until updated.

Normalization excludes cancelled events, merges duplicate official identifiers, unifies district spellings such as Lisbon/Lisboa and formats admission prices where possible. Categories with no announced events remain empty rather than being populated with sample data.

The upstream endpoint has no confirmed availability guarantee. Permission to redistribute its data in a public deployment has not yet been confirmed. Attribution is included, but does not replace permission. Any public repository release also needs to consider the bundled snapshot separately from the application code. Always confirm event details with the organizer.

## Calendar behavior

Event times are interpreted in the venue's local timezone. Exports account for daylight saving time in mainland Portugal, Madeira and the Azores.

When an end time is unavailable, exports reserve one hour and explain that the actual duration must be confirmed with the store. Events without a start time become all-day events. Downloading or importing an event does not subscribe the user to future changes.

Calendar event identifiers and browser preference keys retain their original internal names to preserve compatibility after the PokeRonda rename.

## Install as a PWA

The service worker is registered in production only. `npm run build` prepares the offline asset list automatically. After an initial successful online visit, the app can show cached events without an internet connection. Cached fallback data is marked as stale. Refreshing events and opening Google Calendar require internet access. ICS downloads are generated locally and also work offline.

On a phone, installation requires an HTTPS URL accessible from that device. A Mac's `localhost` does not refer to the Mac when opened on an iPhone, and an ordinary local-network HTTP address does not enable service workers.

- **iPhone:** open the HTTPS URL in Safari, choose **Share → Add to Home Screen**, and enable **Open as Web App** when offered.
- **Android:** use the in-app install action when available, or Chrome's **Install app / Add to Home screen** menu option.

Updates activate after windows using the previous worker have closed. This is a web app, not a native iOS application; an Apple Developer membership is not required for PWA installation.

## Support and feedback

Public destinations are configured in `lib/community.ts`:

- Support: [ko-fi.com/rubenabreu](https://ko-fi.com/rubenabreu)
- Feedback: `ruben_abreu@icloud.com`

Feedback stays in the current page until the user opens their email app and explicitly sends it. The site does not store feedback on a server. An external feedback form can alternatively be configured in the same file.

## Project structure

| Location | Purpose |
| --- | --- |
| `app/agenda.tsx` | Event list, filters, preferences and calendar actions |
| `app/community-links.tsx` | Support link and feedback dialog |
| `app/pwa-controls.tsx` | Installation guidance and connectivity status |
| `worker/index.ts` | Streaming source-page proxy and cache |
| `app/main.tsx`, `index.html` | Static app entry and metadata |
| `lib/events.ts` | Data normalization and filtering |
| `lib/browser-feed.ts` | Pagination, validation and offline list storage |
| `lib/calendar.ts` | Timezone conversion and calendar export generation |
| `public/sw.js` | Service worker template |
| `scripts/build-pwa.mjs` | Production offline asset preparation |
| `tests/` | Event, calendar, preference and service worker checks |

## Build and deployment

```sh
npm run build
npm run deploy
```

`wrangler.jsonc` targets the existing Worker **app**. Existing Git build commands remain `npm run build` and `npx wrangler deploy --name app`; preview versions use `npx wrangler versions upload --name app`. No database, KV namespace, paid plan or new secret is required.

Only `/api/*` invokes the Worker. The home page, scripts, CSS, fonts and icons are served directly as static assets. `scripts/prepare-static.mjs` prepares the fallback and legacy calendar files once at build time. Deploy `dist/client` with the root Wrangler configuration, never an old `dist/server` SSR build. The original `app/page.tsx`, `app/layout.tsx`, `app/api/`, `lib/feed.ts` and historical `.openai/hosting.json` remain for reference but are not part of the active build.

After deployment, reload the page; installed PWAs may need all previous windows closed before the new service worker activates. Review invocation status and CPU metrics for the new version, including uncached `/api/source-events` calls. Local build success does not establish a production CPU duration. The static home page avoids Worker invocation; the API still has Cloudflare's normal limits and depends on the upstream service.

## Project scope

PokeRonda is an independent project and is not affiliated with or endorsed by The Pokémon Company or Pokedata. Pokémon names and third-party data remain subject to their respective owners' rights and terms. No license for upstream data is implied by this repository.

The PT/EN language choice is saved with the filters; new browsers start with TCG and Lisboa.
