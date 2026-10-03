# Original source restoration review

3 October 2026, Windows, branch `preview/fieldwork-vercel`. This is a bounded restoration and an unsaved functional preview. It is not a production cutover, completed shared persistence, or final pixel-identical acceptance.

## Recovered inputs

The following Library files were downloaded into this executor, checked as real readable files, and inspected before extraction. ZIP entries were checked for absolute paths, drive paths, traversal, symlinks and excessive expansion. Source archives and transfer credentials stay outside the repository.

| Input | Library ID | Verified SHA-256 |
|---|---|---|
| Original source, 377764 bytes, 182 entries | `libfile_f972a80d4b3481919a259420b747424c` | `75f15dacbb1d0aec543df5d54b45eef9fbcdf10623e3d5284fcf64cd1ba13af4` |
| Recovered catalog/evidence | `libfile_f2ab77fcfd708191ab12a202cecaab66` | `6f5aee08db01d3b3d83713f1738142a4ace899762f905a66548a2363f554a9f1` |
| Full brief and ID reconciliation, 14856 bytes | `libfile_41adf1402f8c8191841f8d2959a517e9` | `7f3321c427aab703aa56e8d326a19de1d6028cd5ade84ab9677b4468009adcfa` |
| Original mobile map JPEG | `libfile_e18c1ae9c02081918242038f56694fca` | Actual pixels inspected |
| Original mobile Routes PNG | `libfile_614bab7bc1d88191b9c44926086807d2` | Actual pixels inspected |

## Source preservation

`src/components/fieldwork/` contains the actual recovered React UI, adapted to Next.js imports and memory-only preview records. `src/app/fieldwork.css` contains the recovered styling with scoped selectors; `src/app/fieldwork-vendor/` retains Leaflet/shadcn CSS and licenses. `public/fonts/`, `public/map/` and `public/favicon.svg` are recovered assets. The original catalog lives in `src/lib/fieldwork/data.ts`; its city/corridor/source IDs remain intact. Added brief data lives beside it. No recovered backend, D1 handler, Sites boundary assumption, hidden credential, or public unprotected CRUD route is copied.

Dependencies added to run the actual source: Leaflet, Radix UI, class-variance-authority, clsx, tailwind-merge, Sonner, next-themes, and Tailwind/PostCSS animation tooling. Versions are pinned in npm's lockfile; copied fonts/vendor CSS retain licenses. Production dependency audit reports zero vulnerabilities. This is package registry evidence, not a comprehensive security audit.

The legacy advanced planner remains at `/planner-preview`. Its CSS is scoped under `.workbench-app`; its APIs, authentication and RLS migrations are unchanged. Browser tests for it were moved to that retained route without dropping their assertions.

## Visual inspection

Tool: local Chrome, controlled by Playwright, against a production Next.js build at `http://127.0.0.1:3107/preview`. Actual browser PNGs were inspected at desktop 1440x900, tablet 768x1024, phone 390x844, and a 390x714 content viewport for comparison with cropped phone screenshots. The iPhone status bar and ChatGPT/browser chrome in the supplied references are not app content and were not recreated.

Read-only Chrome navigation to the original published site succeeded. Its desktop screenshot confirms the same source styling, map tiles/geography, panel borders, font, dimensions and navigation. The previous live Vercel reconstruction was not used as the design source.

Intended differences: a small Unsaved preview disclosure; city details and a separate Add city action; empirical/raw measurement sections; historical evidence labels; all-corridor lines off initially to avoid obscuring city markers; desktop route details open after a user action; a broader mobile camera matching the supplied map reference; an outlined active mobile tab matching the supplied screenshot. No road geometry is invented. Dynamic map tiles and different viewport/content states prevent a defensible pixel-identity claim.

Evidence directory, outside Git: `C:\Users\localhost\Documents\Codex\2026-10-03\task\evidence`.

- `desktop-map.png`, `desktop-routes.png`, `desktop-city.png`
- `phone-map.png`, `phone-routes.png`, `phone-city.png`
- `fieldwork-{desktop,tablet,phone}-{map,routes,city,observations}.png`
- `original-desktop-map.png`, `reference-phone-map.png`, `reference-phone-routes-scrolled.png`
- `probe.json`: 109 map markers, Manrope, correct ivory background, zero browser console errors/warnings, zero failed requests, no horizontal overflow, selected city above the mobile sheet.
- `reference-check.json`: original site identity confirmed in Chrome.

## Verification

All records used in tests are synthetic and unsaved. No real accounts were created and no venue was contacted.

| Command/check | Actual result |
|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Passed on the clean checkout; lockfile updated for original source dependencies. |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm test` | 46 tests passed across seven files, including original ID reconciliation, observation boundaries, zero outcomes, quality evidence, exclusions and actual economics. |
| `npm run build` | Production build passed. |
| `PLAYWRIGHT_EXTERNAL_SERVER=1 PLAYWRIGHT_PRODUCTION=1 npm run test:browser` with local Chrome | Final rerun: 27 passed at desktop/tablet/phone in 57.1 seconds, including trip status changes, linked visit retention after removal and downloaded JSON records. Six authenticated/provider cases skipped because their real Supabase fixture is absent. |
| `node probe-ui.mjs` outside repository | Desktop/phone identity, actual loaded fonts, map markers, overflow, console/network and selected-city visibility passed. |
| `npm audit --omit=dev --json` | Zero reported production vulnerabilities. |
| `git diff --check` | Passed. |

CI now waits for its owned production server and passes `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 PLAYWRIGHT_EXTERNAL_SERVER=1`; Playwright does not start a competing server. Remote CI and new Vercel deployment are unverified until the branch push completes.

## Integration limits

Reloading clears preview records; JSON/CSV export is a manual local copy. No durable auth/persistence is claimed for the restored interface. The v2 backend's authorized adapters and richer multi-day scheduler still need integration with the restored UI. Actual road routing and timezone resolution remain outside this bounded preview. Arrival/departure are explicitly unconfirmed local timestamps, and actual results are manual entries. Sell-through/velocity requires linked sales records; raw quality evidence is retained without inventing aggregate weights.

The parent reports zero D1 saved rows. This executor did not query D1, import production records, or change the original published site. No new credentials, OAuth grants, paid plans or related-project access was requested.
