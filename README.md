# Fieldwork

A standalone book-sourcing app. Open the production URL and start exploring, planning trips or logging visits. No account is required.

Records save in the current browser. Settings includes JSON backup/restore and visit CSV export. Use one stable URL for your records, since browser storage belongs to an origin. Cross-device sharing requires exporting and restoring a backup. Clearing website data removes that browser's copy.

Development: `npm ci`, then `npm run dev`. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:browser`.

The original v2 backend and its security tests remain in this repository as optional legacy code. The standalone app does not require Supabase, Mapbox credentials or a database service. Historical source claims remain labeled, and corridor sketches are not driving directions.

See `PROJECT_STATE.md` for release evidence and prior architecture history.
