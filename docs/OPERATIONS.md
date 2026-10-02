# Run and operate Fieldwork v2

This is a working reconstruction in Next.js 16 / React 19 / TypeScript, extended from the initial v2 tree available in this checkout. It is **not the recovered ChatGPT app**. The supplied README/AGENTS/specifications are preserved. Recovery evidence and production blockers are in PROJECT_STATE.md.

## Local development

Node 22 LTS (also tested on 24.19.0), npm, and the committed lockfile:

```sh
npm ci
npm run dev
```

Open `/preview` for the clearly labeled, unsaved reference UI. Six approximate city references are derived from the handoff, with no invented stores, halal venues, legacy history or 15/108 totals. Without Supabase bindings, real sign-in/saving are disabled. Copy `.env.example` into secure environment settings for a dedicated project; never paste secret values into source or chat. Local logs, exports and `.env.local` are ignored by Git and Vercel.

## Dedicated Supabase projects and accounts

Use separate **Fieldwork-only** preview and production projects. Do not reuse another app's database. Versioned migrations are in `supabase/migrations`; apply them to an empty isolated target using the Supabase migration tooling or a verified dedicated connection. The web runtime needs only the publishable key; no service-role key is used by app routes. Server requests call `getUser` and check active membership; SQL policies and composite foreign keys independently enforce the workspace boundary. Drivers are assigned to specific crew members and vehicles; foreign crew references are rejected. Partners can edit catalog/trips/results but cannot add memberships, self-promote, or change the shared base. Trip saves are atomic and reject stale/concurrent versions.

Disable public and anonymous signups in **both remote projects**. Configure actual email delivery and password recovery. For each known account, use Supabase's administrator flow after the owner supplies the real email and authorizes invitation; this task sent no invitations and invented no emails. Bind already confirmed account UUIDs with `npm run bootstrap:owner`. It requires `FIELDWORK_DATABASE_URL`, `FIELDWORK_BOOTSTRAP_WORKSPACE_ID`, `FIELDWORK_BOOTSTRAP_OWNER_ID`, optional `FIELDWORK_BOOTSTRAP_PARTNER_ID`, and matching `FIELDWORK_BOOTSTRAP_APPROVED_WORKSPACE`. The script refuses unconfirmed accounts and never creates passwords or contacts anyone. Naim/Kerem names are role labels, not proof of their UUIDs.

Set the following separately for each Vercel deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for that environment's project.
- `FIELDWORK_ENVIRONMENT` and `SUPABASE_ENVIRONMENT`: `preview` or `production` on Vercel; `local` for local development.
- `FIELDWORK_PREVIEW_SUPABASE_URL`, `FIELDWORK_PRODUCTION_SUPABASE_URL`: distinct non-secret pins. Runtime rejects URL/environment mismatch.
- `APP_ORIGIN`: the actual HTTPS application origin. For preview use a stable owned preview alias or set each deployment's actual origin; avoid a broad auth redirect wildcard.
- Supabase Auth Site URL and exact allowed `/auth/callback` redirects must match the intended environment. Recovery uses `/auth/callback?recovery=1` then `/recovery`. The callback's redirect destination is fixed; user-provided `next` URLs are ignored.

Run `npm run check:deployment` with real secure bindings, then real account/RLS and browser checks on the deployed URL. This command checks the boundary and anonymous denial; it cannot claim email delivery, billing, production user identity, or cutover verification.

## Real routing and licensing

Mapbox GL JS 3.32.0 + Mapbox Directions `mapbox/driving` is implemented. Give the browser a restricted, environment-specific Maps token in `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Keep `MAPBOX_DIRECTIONS_TOKEN` server-only. Restrict scopes and browser URL origins in the Mapbox account. The SDK license requires an active Mapbox account and relevant Mapbox terms; the installed `LICENSE.txt` was inspected. Attribution remains enabled. The fallback uses ISC-licensed `us-atlas`, D3 and TopoJSON for reference geography.

Map loads and Directions requests are separate metered products. **No current dollar rate/free allowance, account budget or provider quota was verified**: pricing/docs egress was blocked. Before activation, the owner must check https://www.mapbox.com/pricing/ and https://www.mapbox.com/legal/service-terms/, approve spend, confirm account limits/storage rights, and set alerts. The app adds a conservative bound of 30 route calculations per member/workspace/hour, at most 120 itinerary points, chunks of at most 10 points with overlapping endpoints, 12-second request / 45-second total timeout, and a 650ms edit debounce. Those are app bounds, not claimed provider entitlements. A calculation may produce several provider requests.

Only matching provider-returned per-leg step geometry is displayed. Exact confirmed private origin, access addresses, optional meal location, lodging/depot stops, and home return are included. City drive estimates are explicitly approximate city-centre estimates. No provider geometry, rates or credentials are persisted in the database; responses are `no-store`, held in the current client session, invalidated on point/order changes. There is no persistent routing cache pending license confirmation. Tile/provider failures retain reference geography and show route unavailable; no fabricated highway is used. Per-mile costs become unknown until road miles are known. Passenger-car Directions never certifies truck height/weight clearance. Destination truck pickup with a second car remains provisional until its separate transfer plan, route and costs are validated.

## Import and reconciliation

The original archive/backend is unavailable. No actual D1, saved trip, note or visit row was imported. Do not run a guessed converter or equate public HTML with a full export.

1. Obtain the authorized original archive and any verified Fieldwork-only backend export. `npm run inspect:legacy -- /actual/export/path` reads JSON, ZIP member inventory, or read-only SQLite table counts. A SQLite file alone does not prove Cloudflare D1 ownership/existence. Original SQL/schema, app bindings and field meanings must be inspected.
2. Preserve an immutable private copy and SHA-256 checksum, inspect schema, and explicitly map fields into the versioned `fieldwork-legacy/1` manifest. See `src/lib/data/legacy-import.ts` for supported entities and validated fields. `users` maps original participant IDs to **verified active account UUIDs**. Do not guess time zones, identities or place semantics. Unmapped settings/fields remain raw; origin requires fresh confirmation.
3. Default `npm run import:legacy -- /normalized/manifest.json` inspects only. Applying requires `--apply`, a dedicated `FIELDWORK_DATABASE_URL`, `FIELDWORK_IMPORT_WORKSPACE_ID`, verified owner `FIELDWORK_IMPORT_ACTOR_ID`, and matching `FIELDWORK_IMPORT_APPROVED_WORKSPACE`. Write a private report with `--report=/private/report.json`.
4. Import twice in preview. Deterministic workspace/system/entity/legacy IDs, raw snapshots, durable mappings and import reports preserve provenance. Confirm zero new rows on rerun. Imports insert mapped canonical rows; later user edits are retained. Changed/conflicting duplicate inputs, orphan links, malformed times and unresolved trip participants are preserved/quarantined for review. Catalog rows' importer creator is the verified importing owner; original authors remain in raw snapshots, not a guessed auth identity.
5. Reconcile unique entities, actual places semantics and corridor memberships separately against the reported 15/108 baseline. Inspect saved order/notes/zero results and raw quarantines. The importer does not announce those totals reconciled automatically.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Unit/import/RLS tests use synthetic data; PGlite RLS tests simulate claims and are distinct from real Auth. For real login/RLS, Docker can run official Supabase GoTrue + PostgREST with an isolated PostgreSQL 17 Alpine image (the full CLI image exceeded Docker's disk quota here):

```sh
FIELDWORK_KEEP_TEST_STACK=1 npm run test:auth
```

Keep that process running in its own terminal, build/start the app, then:

```sh
npm run test:api
PLAYWRIGHT_PRODUCTION=1 npm run test:browser
```

Ports 57321/57322/57399/57300 and `fieldwork-qa-*` containers contain only generated `.test` users and synthetic records. No email is sent. Credentials are in ignored mode-600 private files. Tests refuse to overwrite an owner `.env.local` or reuse existing containers; only containers created by the invocation are cleaned up. Stop the test-auth process with Ctrl-C for cleanup. Its marked `.env.local` is a local test fixture; remove it before binding real environments. Browser tests run at 390, 768 and 1440px and skip the real-login cases if the retained stack is unavailable; a skip must not be reported as passed. Browser failures/traces can contain synthetic credentials, so do not publish those private artifacts. CI instructions are included; remote CI has not run.

## Deployment, cutover and rollback

Authenticate Vercel to the owner's dedicated Fieldwork project before deployment. `vercel.json` defines a standard Next build; `.vercelignore` prevents uploading private exports, local credentials and test artifacts. Deploy the tested commit to **preview**, supply isolated Supabase configuration, and verify actual deployed login, denied outsiders, redirects, routing and migration reconciliation. No deployment URL exists from this task.

Keep the original app/data intact. Before cutover, take and restore-test a backup of the owned target and verified legacy backend; freeze legacy writes or capture a final delta, rerun imports, reconcile counts/history and validate both accounts. Only with explicit production authorization and passing checks should that tested release be promoted. Initially use backward-compatible, additive migrations. Frontend rollback retains the migrated target and new writes; do not point back to a stale legacy snapshot or down-migrate/drop tables. Export/reconcile new writes if reverting the data boundary is ever required. Restore drills, final-delta imports and production promotion remain unrun, not solved.
