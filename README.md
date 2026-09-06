# PokeRonda

A responsive Pokémon event calendar for players in Portugal. PokeRonda brings upcoming TCG and VGC events into one place, with clear filters, admission prices and calendar exports.

Built as an independent community and portfolio project. The interface is in European Portuguese. The app currently runs locally; no public deployment is active.

## Features

- **TCG and VGC filters**, with League Challenges, League Cups and prereleases. Prereleases are only available for TCG.
- **Optional friendlies** through a separate checkbox. They are off on every page load, including after a refresh. “All” never enables them. When enabled, they supplement the selected competitive categories while respecting the game and district filters.
- **Events grouped by month and ordered by date**, showing the store, district, location, time and admission price. Missing prices appear as `N/A`.
- **Live result counts** that reflect the current filters.
- **Saved preferences** for game, event categories, district and light/dark theme, using browser local storage.
- **Calendar exports** for Apple Calendar, Google Calendar and other apps that support `.ics` files.
- **Mobile PWA support**, including installation guidance and offline access to previously cached events in production.
- **Discreet footer actions** for optional Ko-fi support and improvement suggestions. Feedback opens the user's email app with a prepared message; it is not sent automatically.

## Tech stack

React 19, TypeScript, Vinext, Vite, Tailwind CSS, shadcn/ui with Base UI primitives, and Lucide icons. The production build targets the Cloudflare Workers runtime. A custom service worker handles offline assets and event responses.

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

The browser checks for updates on launch, when the page becomes visible, and every 30 minutes while visible. The server reuses successful responses for six hours per instance/cache. Different instances or cache locations may refresh independently; this is not a globally enforced request limit. Failed refreshes use a short retry delay and preserve the last available data.

There is no scheduled synchronization job when the app is not being accessed. During outages, the app uses the last successful response or the bundled fallback snapshot and labels it as stale. The initial snapshot was collected on September 6, 2026 and contains 539 source records, including casual events; visible counts depend on normalization, dates and filters.

Normalization excludes cancelled events, merges duplicate official identifiers, unifies district spellings such as Lisbon/Lisboa and formats admission prices where possible. Categories with no announced events remain empty rather than being populated with sample data.

The upstream endpoint has no confirmed availability guarantee. Permission to redistribute its data in a public deployment has not yet been confirmed. Attribution is included, but does not replace permission. Any public repository release also needs to consider the bundled snapshot separately from the application code. Always confirm event details with the organizer.

## Calendar behavior

Event times are interpreted in the venue's local timezone. Exports account for daylight saving time in mainland Portugal, Madeira and the Azores.

When an end time is unavailable, exports reserve one hour and explain that the actual duration must be confirmed with the store. Events without a start time become all-day events. Downloading or importing an event does not subscribe the user to future changes.

Calendar event identifiers and browser preference keys retain their original internal names to preserve compatibility after the PokeRonda rename.

## Install as a PWA

The service worker is registered in production only. `npm run build` prepares the offline asset list automatically. After an initial successful online visit, the app can show cached events without an internet connection. Cached fallback data is marked as stale. Refreshing events and opening calendar services still require internet access.

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
| `app/api/` | Event feed and calendar download routes |
| `lib/events.ts` | Data normalization and filtering |
| `lib/feed.ts` | Upstream requests, caching and fallback behavior |
| `lib/calendar.ts` | Timezone conversion and calendar export generation |
| `public/sw.js` | Service worker template |
| `scripts/build-pwa.mjs` | Production offline asset preparation |
| `tests/` | Event, calendar, preference and service worker checks |

## Validation

```sh
npm run build
npx tsc --noEmit
node_modules/.bin/esbuild tests/events.test.ts --bundle --platform=node --format=esm --outfile=/tmp/pokeronda-tests.mjs
node --test /tmp/pokeronda-tests.mjs tests/pwa.test.mjs
```

Run the build before the service worker tests: they inspect the generated production worker and its asset list. The tests cover filtering, deduplication, admission prices, timezone conversion, ICS formatting, preference restoration, friendlies opt-in and offline fallback behavior.

## Deployment status

The current build uses Cloudflare tooling with a Sites integration. `.openai/hosting.json` identifies an unpublished Sites reservation; it is not a public deployment or a deployment configuration for another Cloudflare account.

For hosting in your own Cloudflare account, start at [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages). Cloudflare supports [GitHub-based builds and deployments](https://developers.cloudflare.com/workers/ci-cd/builds/). The existing Sites-specific configuration must be reviewed and adapted before connecting this checkout to an independent deployment. Runtime CPU usage and upstream connectivity also need validation on the chosen plan.

## Project scope

PokeRonda is an independent project and is not affiliated with or endorsed by The Pokémon Company or Pokedata. Pokémon names and third-party data remain subject to their respective owners' rights and terms. No license for upstream data is implied by this repository.
