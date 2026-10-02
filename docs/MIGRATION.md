# Source recovery, architecture, security and migration

## 1. Recovery is the first gate

Locate the original Fieldwork source/export in authorized local files, the source creation workspace, or a connected repository. An earlier conversation mentioned `Fieldwork-source.zip`; no local path or archive has been verified in this package. Do not infer that a Library text artifact contains the original implementation.

Inventory framework, server runtime, dependencies/lockfiles, assets/fonts and their redistribution rights, external APIs, browser storage, secrets/configuration names (not values), database/schema/migrations, auth identities, and any deployment-specific bindings. Public HTML/assets can help reconstruct the frontend when allowed, but do not recreate server source, database contents, credentials, or account ownership.

If original source is unavailable, record exactly what is accessible. Build a maintainable replacement from the observable behavior and authorized data export where appropriate, but label the result reconstruction and the private-data migration blocked/partial. Do not claim the lost backend was recovered. Do not crawl private endpoints, bypass access controls, or guess passwords.

Earlier context reported Cloudflare D1. Confirm from configuration/source before relying on it. A D1/SQLite export requires schema/type/constraint conversion and data reconciliation for Postgres; pointing a Vercel frontend at the old host is not the requested migration.

## 2. Target shape

One dedicated Fieldwork repository, one Vercel application, and a dedicated Supabase project/data boundary. Reuse an existing *Fieldwork* project if one is found and verified; do not create duplicate paid projects blindly or repurpose another app's database.

Preserve the existing frontend framework if maintainable and deployable. When rebuilding is necessary, prefer React/Next.js with TypeScript and a supported Vercel runtime. Decide versions from recovered dependencies and current official documentation, then pin them and commit a lockfile. Do not force a framework migration solely to match a template.

Supabase Postgres is canonical for shared state; Supabase Auth manages identities. Server routes handle privileged operations and the routing provider boundary. Keep private integrations out of browser bundles. Use private Supabase Storage only if actual uploads/receipts require it; do not add unused services.

Mapbox GL JS with its own compatible styles and Directions is a coherent default to evaluate. Another licensed renderer/route provider can be chosen when it better fits the existing code and authorized access. Document the one selected production stack, provider terms, attribution, cost model, domain restrictions, rate/waypoint limits, and failure behavior. Do not combine provider assets contrary to their terms, depend on a public demo route server as production infrastructure, or promise free unlimited use.

No microservices, background orchestration, separate search database, full travel-booking system, or new Amazon data dependency is required for this scope.

## 3. Auth and authorization

Invite-only shared workspace with distinct Naim and Kerem accounts. Owner controls membership and sensitive configuration; partner can plan/log shared operations. Resolve exact emails through authorized context or user input; do not invent recipients, share passwords, or treat display names as authentication. Sending an invitation is a real outbound action and needs an explicitly resolved intended recipient and authorization.

Prefer one well-tested auth flow (for example email/password with recovery for invited accounts); implement verification, sign-out, recovery and session expiry appropriately. Account email delivery/SMTP and redirect configuration must be tested, not assumed from a successful login form render. Record an exact blocked delivery step when integration access is missing.

Validate server-side identity using the current supported Supabase methods, not unverified cookie/session objects. If using Next.js SSR, implement current @supabase/ssr cookie refresh and version-appropriate middleware/proxy conventions from official docs. Avoid shared CDN caching of authenticated responses/cookies.

Use workspace_members as the authorization source with active membership checks, not user-editable metadata or a browser-provided role. Prevent self-join, self-promotion and workspace reassignment. If membership claims are cached, account for revocation/staleness. For user data accessed through normal app clients, use user-scoped credentials so RLS actually runs; a service-role server route must independently enforce equivalent authorization where genuinely necessary.

Enable row-level security on every exposed table, set explicit least-privilege grants, and write operation-specific policies. Test USING and WITH CHECK for updates and require select policy where needed. Enforce same-workspace relationships through scoped foreign keys or equivalent constraints, not UI filtering alone. Index workspace/membership fields used by policies.

Views, RPCs, triggers, background tasks, storage buckets and caches must not bypass the intended boundary. Prefer invoker behavior; review and narrowly constrain any privileged function and its execute grants/search path. Keep privileged Supabase secret/service credentials server-only, never NEXT_PUBLIC_ or committed in files.

## 4. API and route-provider safety

Authenticated routes must validate workspace access, coordinates, list lengths, supported profiles, dates and constraints. Add sensible request limits, rate limiting, timeouts, bounded retries/backoff, request cancellation and redacted error logs. Call a fixed approved provider hostname rather than accepting an arbitrary user-supplied URL. Do not expose an unlimited unauthenticated routing proxy.

Separate browser-intended, domain-restricted map tokens from server credentials. Confirm the provider's actual key scopes and storage terms. Private home-origin coordinates must not leak through public analytics/logs or globally readable route caches. Route outputs retain provider/type/time labels and cannot be fabricated when a request fails.

## 5. Migration procedure

1. Record the source version, schema and dataset inventory. Export an encrypted/private backup and verify it is readable. Never commit private backups, source credentials or user exports to a public repository.
2. Create a migration mapping for cities/corridors, sources/events, visits, trips/stop order/dates, settings, identities and notes. Preserve legacy IDs or explicit legacy-to-new mappings. Classify missing fields and unresolved references instead of making them up.
3. Separate public/catalog records from private workspace data. Count unique entities and corridor memberships separately; the displayed 108 places is a reconciliation clue, not permission to overwrite counts. Record exclusions, deduplication reasons and orphan handling.
4. Create versioned Postgres schema/grants/RLS migrations and clean staging/test fixtures. Use the Supabase tooling available in the actual environment and verify current CLI help before commands. Keep schema and security reproducible in source control.
5. Implement import validation/dry run, transaction boundaries/batches, deterministic keys and idempotent reruns. Store import-run metadata, counts, warnings and failures. A second import of the same data must not duplicate visits, expenses or trips.
6. Import into isolated staging. Compare row counts, IDs, representative field values, links, stop order, timestamps, and totals; repair mapping defects without editing away inconvenient source records.
7. Do not claim that downloading a frontend migrates auth identities/passwords. Determine whether the legacy identity system supports a safe supported migration. Otherwise map ownership explicitly and use user-approved invitation/recovery into Supabase; never synthesize usable passwords or impersonate users.
8. Exercise app flows with migrated data and nonprivileged accounts. Test a member, nonmember, second workspace and signed-out client. Repeat restore/import to verify recovery, not merely backup creation.
9. Cutover needs an explicit write-freeze or final-delta strategy so later changes on the old site are not lost. A write freeze is a production action requiring owner authorization. Avoid ad hoc dual writes.
10. After authorized final sync and passing validation, promote production and verify it. Retain the original source/data and a documented rollback window. Do not delete the old deployment automatically.

## 6. Environments and deployment

Use local development plus an isolated Vercel preview connected to isolated Supabase data. Production uses production settings. A preview must not write to the original/production database by accident. If an extra Supabase project or branch requires paid provisioning, request that specific approval; do not silently weaken data isolation or buy capacity.

Configure environment variables using authenticated tools or secure secret entry; never ask for secret values to be pasted into a public document. Supply `.env.example` with names only once the actual stack is decided. Likely categories: Supabase URL, browser publishable key, any strictly necessary server secret, public origin, map browser token, server routing token, provider config and allowed origins. Exact names and scopes belong to the chosen implementation, not this template.

Set Supabase site URL and tightly scoped preview/production callback/recovery URLs. Test sign-in, refresh, protected routes, logout, recovery and invitations in the actual deployed origins. Use deterministic test identities and cleanup in nonproduction; do not insert fabricated visits into live history for a smoke test.

Run CI for formatting/lint, type checks, unit/integration tests, RLS tests and production build. Browser checks must run against the actual preview; an HTTP 200/login page is not enough. Record service health/config problems separately from app defects.

## 7. Release and rollback gates

Required gates: recoverable backups, reconciled import, no leaked keys/private origin, passing auth/RLS isolation, actual road routing or an explicitly partial release designation, feasible scheduler cases, cross-session persistence, mobile/desktop visual checks and callback correctness.

Production promotion is not permission to retire the old app. Record a rollback deployment identifier plus the data recovery approach. Understand that rolling back frontend code does not automatically undo database writes; prefer backward-compatible schema migrations and a tested point-in-time/export restore strategy where available. Report actual retention/capabilities instead of assuming a plan includes a particular backup product.

Final report contains: repository/branch/commit, recovered source version, schema/import version, records reconciled/missing, staging and production identifiers, actual verified deployment URL(s), commands/tests with outcomes, screenshots where captured, residual risks, and exact remaining owner actions. An inaccessible source export, unavailable credentials or failed live route check cannot be described as completed.
