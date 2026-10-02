# Fieldwork implementation plan

Date: 1 October 2026 (America/Chicago). Mode: **inspection and planning only**.

## 1. Decision and evidence boundary

Prepare an owned Fieldwork web app on Vercel with Supabase Postgres and Auth, retaining the original frontend where practical. **Application-source recovery and the live interaction audit are blocked.** This is a concrete gated plan for this repository, not a claim that an implementation tree, backend, or dataset has been recovered.

The selected repository is naimozduman/FBA-MAP-TRIP at /workspace/FBA-MAP-TRIP. Before this work it contained only Git metadata: no application files, manifest, lockfile, CI, assets, migrations, or guidance. Its local unborn branch is work, with no HEAD commit. Native Git read access succeeds, but origin advertises no references; the requested main branch does not exist. This does not prove that Fieldwork has no source elsewhere.

Only documentation was added to the repository during this task; read-only diagnostic scripts and outputs are outside the checkout. No application code, dependency installation, data export/import, SQL migration, account creation, invitation, production mutation, provisioning, booking, deployment, or environment-policy change was performed.

### Current-run evidence

| ID | Operation and result | What it establishes |
|---|---|---|
| E1 | Local file inventory; git status clean before documentation; git ls-remote origin exited 0 with no refs; main-ref check exited 2; HEAD verification exited 128 | The selected checkout is empty and has no source version to cite. |
| E2 | Downloaded and read all eight supplied Markdown files | A specification/handoff was recovered. README explicitly says it is not an application source export. |
| E3 | Authorized project/thread discovery found “Fieldwork sourcing hub,” thread 6abe1a1d-0b60-83ea-b6bf-e867604f7317; read its messages | Its earlier assistant message links Fieldwork-source.zip and QA.md and reports Cloudflare D1, 15 corridors, and 108 places. These are historical claims, not independently verified backend/source evidence. |
| E4 | curl to the reference app, including a sandbox-escalated read-only attempt: exit 56, CONNECT tunnel failed, response 403 | This environment's proxy blocked access. This is not proof the app is down. |
| E5 | Playwright 1.62.1 with /usr/bin/chromium, at 1440×900 and 390×844; both navigations returned ERR_TUNNEL_CONNECTION_FAILED | Only browser error pages were captured and inspected. Neither screenshot is accepted as application evidence. |
| E6 | Configuration metadata has package_managers-only restricted egress, no declared secrets/runtime requirements; relevant exported variable names checked without printing values | No Fieldwork-specific Supabase, Vercel, Cloudflare, or Mapbox binding was found here. Provider/account access is not established. |
| E7 | Read-only requests to Mapbox Directions, pricing and terms, Supabase SSR docs, and Vercel environment docs also returned proxy 403 | Current vendor prices, limits, licensing details, and SDK conventions could not be independently rechecked. |

Raw current-instance diagnostics are under /workspace/scratch/fieldwork-audit/: recovery-inventory.json, browser-probe.json, provider-probes.json, live.headers.txt, live-escalated.headers.txt, and the two *-blocked.png images. The browser probe allowed only GET/HEAD requests. The absent Browser plugin was the reason for using installed Playwright; no browser dependency was installed.

The earlier export link is **sandbox:/workspace/scratch/Fieldwork-source.zip in its original conversation**. Its QA link is sandbox:/workspace/sites/fieldwork/QA.md in that conversation. These are discovered references, not paths to recovered files on this machine. Authorized local file inventory, project metadata, and this chat's attachments did not expose the archive bytes. The download tool accepts supplied file IDs; there is no exposed cross-conversation sandbox-file retrieval tool. No path or file ID was invented.

### Audit coverage

| Flow | Current outcome | Required next observation |
|---|---|---|
| 1. Desktop Explore entry | Blocked before app rendered | Capture initial map, labels, roads, controls, navigation, and errors. |
| 2. City selection, including marker over route | Not run | Observe actual panel, propagation, separate Explore city/Add to trip actions, and draft preservation. |
| 3. Trip/day/overnight detail | Not run | Inspect actual timeline, route geometry, dates, resource assignments, and state persistence. |
| 4. Phone Explore and panels | Blocked before app rendered | Capture touch, sheet scroll/close behavior, selected-marker visibility, and focus restoration. |
| 5. Keyboard, contrast, persistence, auth | Not run | Measure rendered colors/targets and test nonmutating navigation; inspect persistence from source before authorized save tests. |

The handoff's reports of a St. Louis label, corridor-focused panels, and planning sketches are retained as prior observations. Low contrast, city clicks opening corridor panels, and unrealistic scheduling are user-reported requirements until independently tested. No numerical contrast ratio, current store hours, live driving estimate, authentication behavior, or current app save/reload result is asserted.

## 2. Preserve, recover, or replace

The supplied AGENTS.md and README.md were preserved unchanged at the repository root; product, trip, migration, acceptance, and evidence documents were preserved unchanged under docs/. The original state document is retained unchanged at docs/handoff/PROJECT_STATE.initial.md; PROJECT_STATE.md records this inspection. There was no pre-existing checkout guidance to overwrite. The current request controls plan-only mode even where the handoff describes future implementation.

| Component | Disposition and reason |
|---|---|
| Fieldwork name, regional territory, corridor discovery, sourcing preferences | Preserve as product intent; exact visual tokens and catalog records still require recovery. |
| Original framework, map component, assets/fonts, dependency versions and licenses | Undetermined. Do not replace based on an empty destination repo or guess its framework from the hostname. |
| Existing corridor/city content and source leads | Preserve recoverable records with provenance and legacy IDs; distinguish lead text from an actual venue/event. |
| Saved trips, counts, visits, source notes, metrics, settings | Migration-required if recoverable. Their existence is reported; records and row counts are unknown. |
| Original backend and auth | Investigate first. The target is Supabase; legacy identity/data conversion depends on the actual implementation. |
| Conceptual corridor lines | May remain as clearly labeled discovery sketches, subordinate to city selection. Never reuse them as driving geometry. |
| Shared-password or browser-only canonical state, if discovered | Replace with distinct Supabase identities and durable workspace data. Their existence is not currently established. |
| Existing deployment | Preserve untouched throughout staging and the authorized cutover/rollback window. |

### Recovery gate: required before a code-specific change map

1. Obtain the discovered archive bytes or a populated authorized repository/ref. Hash and inventory the archive safely, rejecting path traversal/symlinks escaping the extraction directory. Preserve an original copy privately. Inspect before installing or executing any scripts.
2. Record source version/export date, actual file tree, package scripts and lockfile, runtime/version pins, component entry points, assets/fonts and redistribution rights, deployment files, API adapters, storage code, auth behavior, schemas and migrations. Record credential names only; keep any embedded secrets out of logs and Git.
3. Identify exact handlers for city/corridor selection, map layers/hit testing, trip construction, saves/visits/notes, and origin settings. Replace the proposed path map below with these **actual recovered paths**, recording retain/change/remove decisions.
4. Verify the D1 claim: look for actual Worker code and wrangler.toml/wrangler.json/jsonc D1 bindings, then use authorized read-only account access to confirm the deployed Worker binding and matching database. Inspect schema/counts and a permitted export. A config declaration alone is not proof the deployed database exists; an inaccessible database is not evidence of absence.
5. If D1 is absent, determine the actual persistence mechanism and its export route. A ZIP may include schema but no live user data. Public HTML, JS, screenshots, or a content artifact cannot establish recovery of server code or private records.
6. Once network access works, capture the audit flows above with fresh DOM checks before actions. Inspect known public endpoints used by the app; do not guess private endpoints or bypass authorization. No live write-based save tests without separate authorization.

**Framework decision:** retain a maintainable Vercel-compatible recovered frontend and translate only the required backend boundary. If the original source cannot be recovered or its architecture cannot reasonably meet the target, use a reconstruction in Next.js/React with TypeScript. Document the reason and loss limits first. No framework or dependency versions are pinned in this plan because none were recovered and current documentation is blocked.

## 3. Baseline reconciliation and preservation contract

| Entity | Reported baseline | Actual export/database count |
|---|---|---|
| Corridors | 15 | Unknown |
| “Places” | 108; meaning and counting method unresolved | Unknown |
| Unique cities/localities | Not separately reported | Unknown |
| Corridor-to-city memberships | Not separately reported | Unknown |
| Source leads vs addressable venues vs dated events | Not separately reported | Unknown |
| Saved trips, ordered stops, visits, notes, metrics, settings | Features reported; no counts supplied | Unknown |
| Legacy auth identities/ownership | Not established | Unknown |

No app records were recovered here; **this is not a count of zero records in the live app**. Do not construct 108 records from narrative lists or use that number as an import target.

The future reconciliation report must show, per entity: exported rows, unique legacy IDs, normalized unique records, duplicates and reasons, orphan references, quarantined records, imported rows, preserved legacy links, and unresolved fields. Resolve what the UI's “places” counter actually sums from source/query code. Count unique places separately from membership rows and distinguish home/city/venue/event records. City names need state/country or a reliable locality identifier; Springfield MO and Springfield IL must remain different. Multi-corridor membership and repeated city visits are legitimate.

Preserve source leads without inventing addresses, hours, prices, sale dates, halal businesses, yields, or outcomes. Preserve visit timestamps, negative/zero outcomes, book counts, note text, trip stop order, ownership, and timezone uncertainty. Quarantine unresolved relationships; never silently discard them or attach them to a guessed user/city.

## 4. Target data boundary and authorization

Use a dedicated Fieldwork Vercel project and dedicated Supabase boundary, or a verified existing Fieldwork project if available. Do not reuse FBA Ledger, Jarvis, or another application's database. All business data below is workspace-scoped, including imported catalog content; public publishing is outside this scope. Both partners share one invite-only workspace while retaining separate accounts.

### Proposed schema — no tables have been created

Every tenant table has workspace_id, a UUID primary identity, timestamps, and an appropriate revision/audit trail. Use unique (workspace_id, id) parent keys and composite foreign keys to prevent cross-workspace links. Store UTC instants plus original local date/time and IANA zone where needed, integer minor currency amounts with currency, and meters/seconds/kg/liters rather than ambiguous units. Unknown numeric facts are nullable.

| Tables | Essential fields and invariants |
|---|---|
| profiles; workspaces; workspace_members | Profile keyed by auth.users ID; membership PK (workspace_id,user_id), owner/partner role and active/suspended status. Display names never authorize access. Retain historical authorship after revocation. |
| workspace_settings | Private base coordinates/address precision, confirmation time, America/Chicago default, preferences, version. Approximate Affton/Lakeshire label initially; no invented street address or exact home pin. |
| cities; corridors; corridor_cities | Canonical locality/state/country, optional centroid precision, zone, sourced overview; membership unique by workspace/corridor/city with discovery order. Membership does not imply itinerary order. |
| source_leads; sources; source_events; source_openings | Leads remain unroutable until promoted with an actual identity/address. Venue category/brand, precision and verification; dated events and split/exception/appointment windows with local zone. Source/event relations stay scoped. |
| evidence_records; source_evidence; city_evidence | URL/reference, claim type, checked/observed time, validity and confidence. Typed linking tables with scoped FKs avoid an unchecked polymorphic target ID. |
| food_places; food_evidence; food_openings | Actual businesses only; certified/business-stated/community-reported/unverified status, scope and source dates. Cuisine is descriptive, never halal proof. |
| trips; trip_participants; trip_days; city_visits | Explicit departure/return instants and local inputs, origin/return snapshot, revision, status/reasons. Participants reference workspace membership. A city visit has its own ID and reserved work minutes; a city can recur. |
| trip_stops; itinerary_activities; lodging_stays | Ordered exact-address waypoints belong to a trip/day and optional city visit. Activities explicitly represent sourcing, drive, meal, wait, parking/loading, rest and lodging. A hotel connects adjacent day endpoints, check-in/out and rest. |
| route_legs | Scoped from/to stop references, provider/profile, geometry if storage is permitted, meters/seconds, request revision, fetched time, departure estimate type, snapping quality, available/stale/unavailable state. No invented geometry. |
| vehicles; trip_vehicle_assignments; rental_scenarios | Verified or unknown usable payload/volume, participant/driver assignments, pickup/return addresses/windows, quoted rate structure/date and transfer plan. Vehicle and person overlap checks span trips. |
| source_visits; visit_metrics; trip_expenses; notes | Actual outcomes distinct from planned city visits; provenance, acquired/usable counts, observed duration/cost, source/date links. Notes use typed scoped targets. Costs retain their inclusion basis to avoid double counting. |
| import_runs; legacy_entity_map; mutation_requests; audit_events | Export/mapping version, checksum, counts/errors; unique legacy mapping; scoped idempotency keys; redacted actor/action record. Private raw backups and credentials never enter these tables or Git casually. |

### Access rules and server enforcement

- Supabase Auth: distinct invited Naim and Kerem accounts, email/password plus verified email/recovery as the initial proposed flow. Disable public signup. Exact emails, owner bootstrap and any outbound invitations remain unresolved and unauthorized in this task.
- Server handlers verify identity using supported Supabase server validation (getUser as the proposed baseline, rechecked against the pinned SDK), then query **current active membership** for the requested workspace. Unverified cookie/session data, client roles, display names, and user-editable metadata do not grant authority.
- Enable RLS and least-privilege grants on every exposed table. Anonymous/nonmembers get no business data. Active partners can read the shared workspace and edit operational drafts/observations; only the owner can change membership and sensitive workspace settings. Privileged imports and membership administration are narrow owner-verified server operations.
- Normal application queries use the authenticated user's client so RLS executes. Keep any genuinely necessary admin/secret key server-only; never use it as a general shortcut around policies.
- SELECT/DELETE use membership and operation rules; INSERT uses WITH CHECK; UPDATE uses both USING and WITH CHECK. Reject workspace_id reassignment even by a user belonging to both workspaces; enforce immutable tenant IDs, scoped foreign keys, actor attribution and protected column grants.
- A narrowly scoped private membership helper may use SECURITY DEFINER to avoid membership-policy recursion: fixed qualified objects/search_path, auth.uid-based checks, no arbitrary user argument, no dynamic SQL, revoked PUBLIC execute and minimal explicit grants. Other application RPCs/views default to invoker behavior. Review function owners, grants, triggers, caches and any Storage separately.
- Preserve at least one active owner transactionally. Partners cannot self-join, invite/promote themselves, change protected role fields, attach foreign-workspace resources, or spoof creators. Revocation must affect subsequent requests rather than relying on stale role claims.
- Trip aggregate saves are transactional and compare an expected revision; conflicting edits return an explicit conflict instead of last-write-wins. Retries for visits/expenses use a unique workspace-scoped mutation key. No localStorage-only canonical state; any offline draft is labeled unsynced and private caches clear on logout.
- SSR cookie refresh follows the recovered/pinned framework's current convention; protected responses must not be publicly cached. Check same-origin/CSRF protection for cookie-based mutations and exact authorized callback/recovery origins.

## 5. Routing provider decision

**Selected planning default: Mapbox GL JS + Mapbox Directions, driving profile.** It offers a coherent licensed map/road-geometry stack and avoids treating conceptual corridor paths as routes. Revisit only if recovered integrations provide a demonstrably better compatible option; record one chosen production provider rather than mixing incompatible tiles/styles/geometry.

| Concern | Concrete plan and current limit |
|---|---|
| Cost | Budget map loads and Directions requests separately; optional geocoding/traffic/matrix are separate billable features. Cost = billed units after the applicable allowance × current account rates, plus platform/SMTP costs. No current dollar price or free allowance is asserted: pricing retrieval was blocked. Record the dated account quote/rate schedule and approved spend ceiling before live integration. Recalculate on meaningful edits, debounce/cancel stale requests, and avoid calls on every render. |
| Keys | A browser-intended map token with least scopes and approved URL restrictions; a separate server routing credential in protected deployment settings. Token visibility alone does not make the browser token an admin secret. Verify supported scopes/restrictions against current docs; restrict preview access too. No keys were found, created, or copied. |
| Limits | Validate ordered points, profile, coordinates, precision and snapped positions. Proposed app cap: ten waypoints per request, subject to the actual provider/account limit; this is an app choice, not a claim about Mapbox's current maximum. Split longer day routes at shared real endpoints and reconcile legs. Record documented waypoint/rate/distance limits before implementation; bounded retries, timeout, cancellation and per-user/workspace request quotas are required. |
| License | Confirm current commercial use, compatible style/font/tile rights, required Mapbox/data attribution, and route/geocoding retention terms. Default to no durable provider-response cache until permitted retention is established. Never promise unlimited free use or use a public demo server for production. |
| Geometry | Route exact confirmed origin → actual selected venue/event addresses → local transfers/food/lodging/rental depots as needed → exact return destination. City-centroid exploration estimates remain approximate. Draw only geometry returned for the matching ordered points/revision. |
| Failure | Display **route unavailable** for missing key, timeout, rate limit, no route or invalid points. If legally retainable, a prior route may be separately labeled stale; it must not verify a new schedule. Offer a clearly provisional manual time budget without drawing a substitute highway path. |
| Truck | Standard driving directions do not verify truck clearances, weight/height restrictions or parking. A truck scenario remains provisional where required road constraints lack evidence; do not label passenger-car routing truck-safe. |

The authenticated routing endpoint uses a fixed provider hostname, validates membership and input bounds, and fetches authorized stop/origin data. It cannot become a public unlimited proxy or accept arbitrary remote URLs. Log errors without keys/private coordinates. Cache, if allowed, by workspace plus ordered points, profile, avoidance and applicable departure/time bucket; no globally readable home-origin cache. Traffic labels must reflect the provider actually used.

Manual coordinate/pin entry is sufficient for the first origin editor. Address search/geocoding is optional until its provider, storage rights and cost are confirmed; an address string is not an invented geocoding result. Exact origin confirmation is required before reliable trip times/Ready status.

## 6. City, map and trip behavior

Retain Fieldwork's identity after the real app/assets can be inspected. Use a restrained warm neutral/light surface, near-black text, and limited green/amber/rust accents. This is a proposed direction, not an observation of recovered tokens; avoid purple/blue-led branding and a generic dashboard replacement.

- Explore city and Add to trip are distinct actions. A marker, keyboard list selection, or trip-list city selection opens the same CITY panel: sourced short overview, nearby opportunities, actual venues/events when known, origin-based drive estimate and precision, halal evidence/check dates, and our visit history. Opening the panel never adds a stop.
- Keep selected city, selected stop, selected route leg and corridor filter as separate state. Marker hit priority overrides underlying lines; route-leg selection may show drive detail independently. Closing a panel or clicking the map preserves unsaved drafts. Recenter only on an explicit Fit trip/Return to base action or a meaningful initial selection.
- Use a desktop side panel and phone bottom sheet with accessible close/back controls, focus handling and a text-list alternative. Cluster dense markers, preserve readable city labels/roads, and differentiate routes with outlines, leg/day labels and a legend rather than color alone.
- Measure normal text at least 4.5:1, qualifying large text 3:1, and required controls/graphics 3:1 against actual adjacent backgrounds, including focus, selection, hover and error states. Aim for 44 CSS-pixel touch targets and test keyboard use. A screenshot impression cannot certify WCAG AA.
- Keep regular Goodwill retail and Half Price Books excluded by default. Model Goodwill outlets separately. A current-trip exception records the source, actor and reason on that trip rather than silently enabling the brand globally.
- Halal entries require business/certifier/community provenance, scope and check dates; stale/unknown remains visible. Empty results offer discovery links without fabricating restaurants. Meals require actual windows and transfer time when included in a confirmed itinerary.

### Scheduling contract

Trip → Days → City visits → Store/event stops is the hierarchy; an explicit activity ledger owns all elapsed time. Coarse city planning reserves four hours by default, editable around the requested 3–5 hours. Detailed sourcing, ordinary parking/loading and local transfers consume that reservation once. Show unused time as unallocated and overruns as additional required time; never add the entire allowance on top of fully scheduled activities or erase it when the first store is added.

Day trip, 2 days / 1 night, 3 days / 2 nights and 4 days / 3 nights have explicit departure/return dates and 0/1/2/3 lodging stays. Each hotel is an actual day-end/next-day-start waypoint with check-in, rest and checkout. A hotel region alone produces a provisional itinerary.

Start with one primary city/day. Add another only after actual road legs, local transfers, source/event opening windows, work durations, meals/loading/rest, resource availability and the return deadline fit. A configurable 06:00 departure does not imply an open store; include waiting where necessary. Do not shrink visits or omit home return to hide conflicts.

Compute earliest arrival from elapsed route seconds and explicitly allocated contingency; intersect the full proposed visit interval with the actual opening/appointment/event windows. Unknown hours are not all-day availability. Missing routing, origin, hotel or material source inputs makes a plan provisional; a known broken hard constraint still appears as infeasible. Tight/feasible labels explain their buffers and are not guarantees.

Use UTC instants and each location's verified IANA zone, with America/Chicago as the home display zone. Resolve local input gaps/folds at DST transitions explicitly; do not apply an assumed fixed offset to Indiana/Kentucky. Route/schedule responses carry the trip revision so an older response cannot replace a new stop order/origin/hotel.

Preferred crew is Naim + Kerem in one vehicle; solo presets are supported. Separate saved trips are independent drafts. Optional parallel plans need actual separate people/vehicle assignments with time-overlap checks. Two people do not imply two vehicles, doubled yield, halved stop durations or a twice-weekly cadence.

### Overnight, cargo and economic decisions

Compare alternatives from source confirmation/dates, opening windows, evidence-backed expected usable books, actual quoted/entered costs, cargo constraints, and door-to-door elapsed/person-hours. An untested city is labeled untested, regardless of its pin count; expose observation dates and sample sizes.

Personal-car and rental-truck scenarios include pickup/return depots/windows, eligible drivers, passenger/gear allowance, loading/unloading, payload and volume separately, fuel/tolls and quote inclusions. Destination truck pickup must explain how the personal car gets home. A solo driver with two vehicles and no transfer solution is infeasible. No rental price, availability, truck specification, booking or profitability is invented.

Define per-book contribution and its included acquisition/fees/prep/freight before computing a scenario. Do not subtract those costs twice or combine an inclusive mileage cost with fuel again. Shared vehicle cost is charged once; person-hours sum each participant's actual assigned time, including lodging/rest treatment explicitly so active-work and door-to-door denominators are not confused. Missing costs/yields leave the comparison incomplete, not zero.

Extra-night/truck break-even uses incremental cost divided by a positive, explicitly defined per-book contribution only when both exist. Show downside and extra hours alongside the result. Expected resale contribution is a projection, not realized profit or cash received.

## 7. File and module change map

**Actual application paths are unavailable.** The only existing files that can be concretely referenced are the handoff documents now preserved in this checkout, IMPLEMENTATION_PLAN.md and PROJECT_STATE.md. No application module has been changed.

At the recovery gate, fill a mapping of recovered path → retained/replaced behavior → corresponding target path, with source version and dependency decision. The following is a **proposed reconstruction layout**, not a discovered tree, and applies only if Next.js reconstruction is justified. Retained-framework implementation should use the recovered entry points instead.

| Proposed new path(s) | Responsibility and change |
|---|---|
| src/lib/supabase/browser.ts; src/lib/supabase/server.ts; src/lib/auth/require-membership.ts | User-scoped clients, validated server identity, active membership and owner guard. Add the pinned Next.js SSR refresh entry point only after checking its middleware/proxy convention. |
| src/app/(auth)/sign-in/page.tsx; src/app/auth/callback/route.ts; src/app/(auth)/recovery/page.tsx | Distinct login/recovery/callback flows with controlled redirects. No mock/shared-password login. |
| src/app/workspaces/[workspaceId]/explore/page.tsx; trips/[tripId]/page.tsx; settings/page.tsx in that workspace subtree | Protected Explore, trip/day and private-origin settings. |
| src/components/map/FieldworkMap.tsx; src/components/cities/CityPanel.tsx; CitySheet.tsx; CityList.tsx | Independent city selection, route/marker hit priority, accessible list and desktop/phone panels. |
| src/styles/tokens.css | Measured text/control/map contrast while preserving recovered identity. |
| src/lib/cities/get-city-detail.ts; src/lib/sourcing/preferences.ts | Authorized city opportunities/history/evidence aggregation and audited trip-specific filter overrides. |
| src/app/api/workspaces/[workspaceId]/routes/route.ts; src/lib/routing/mapbox.ts; src/lib/routing/contracts.ts | Authenticated fixed-provider boundary, validated road legs, unavailable states, limits and revision handling. |
| src/lib/planning/schedule.ts; time.ts; economics.ts; transport.ts in that directory | Pure scheduling, DST/window logic, nonduplicated costs and vehicle/resource feasibility. |
| src/components/trips/DayTimeline.tsx; CityVisitEditor.tsx; ScenarioCompare.tsx; CrewPicker.tsx | Work-window ownership, actual activity ledger, duration presets and evidence-backed alternatives. |
| src/app/api/workspaces/[workspaceId]/trips/[tripId]/route.ts; src/server/trips/save-trip.ts | Atomic revision-checked aggregate saves and conflict handling. Visit/expense mutations use scoped idempotency keys. |
| supabase/migrations/<timestamp>_identity.sql; _catalog.sql; _trips_outcomes.sql; _grants_rls.sql | Ordered schema, scoped relationships, protected fields, grants/RLS and narrowly justified RPCs. Names are templates; no migration exists yet. |
| scripts/inspect-legacy.ts; scripts/import-fieldwork.ts; docs/LEGACY_MAPPING.md; docs/RECONCILIATION.md | Read-only export inventory, dry-run mapping, idempotent staging imports and discrepancy ledger. No private raw exports committed. |
| tests/unit/schedule.test.ts; time.test.ts; economics.test.ts; transport.test.ts | Deterministic supplied fixtures and real failure cases. |
| tests/rls/workspace-isolation.test.ts; tests/integration/import.test.ts; trip-concurrency.test.ts | Nonprivileged access/relationship attacks, repeat imports and duplicate-save/concurrency prevention. |
| tests/e2e/city-explore.spec.ts; itinerary.spec.ts; auth.spec.ts; .github/workflows/ci.yml | Desktop/mobile/keyboard, auth lifecycle and isolated engineering gates. |
| .env.example; docs/DEPLOYMENT.md; PROJECT_STATE.md | Configuration names only, actual project/origin IDs and tested release/rollback evidence once available. |

Candidate configuration names are NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN, MAPBOX_DIRECTIONS_TOKEN and APP_ORIGIN. SUPABASE_SECRET_KEY is server-only and included only if privileged bootstrap/import/admin operations actually need it. These are proposed names, not discovered bindings or saved environment changes. SMTP is configured securely for the selected Supabase auth delivery path. Secrets must not be pasted into chat or committed.

## 8. Data migration, cutover and rollback

This is a future procedure requiring separate implementation/cutover authorization; nothing here has been executed.

1. **Acquire and verify a private backup.** Obtain source/schema and authorized read-only exports, identify the Fieldwork database by actual project/binding identifiers, hash files, verify readability and retain encrypted/private originals. Determine whether user data lives in D1, browser storage or another service. A source ZIP alone does not migrate live records.
2. **Map without inventing.** Preserve legacy IDs and ownership, distinguish catalog/leads/events from private history, resolve SQLite types/booleans/JSON/constraints and time-zone ambiguities if D1 exists. Document uncertain timestamps or missing identities. Do not assume downloadable passwords/auth accounts.
3. **Stage reproducible schema/security.** Apply versioned migrations only to an isolated approved local/staging Supabase target. The importer refuses a target not matching the explicit Fieldwork staging allowlist; preview must never fall back to production credentials.
4. **Dry run, then import idempotently.** Produce counts, warnings and quarantines first. Upsert through a unique legacy mapping keyed by workspace/system/entity/legacy ID; do not overwrite later user edits blindly. With no stable ID, deterministic export-record keys permit rerunning that same export, but newer-export matching needs reviewed reconciliation. Store checksums, mapping versions and transactional batch results.
5. **Reconcile and restore.** Compare unique cities/places, memberships, source leads, event data, ordered trips, visit/notes content, settings, timestamps and totals. Run the same import twice with zero unintended changes/duplicates. Restore a clean staging instance and repeat to prove the backup is usable.
6. **Resolve identities.** Use supported identity migration if the actual legacy system allows it; otherwise obtain owner-approved mapping to real Supabase accounts and an authorized invitation/recovery action. Do not fabricate password migrations or infer ownership from the names Naim/Kerem.
7. **Validate preview.** Test auth/RLS, cross-session saves, realistic road geometry, schedule fixtures and migrated representative data in isolated preview. Use synthetic test writes; production history gets no smoke-test visits.
8. **Authorize final synchronization.** Choose a short owner-approved legacy write freeze or a supported final-delta procedure after learning the real backend. Record final export watermark/checksum and reconcile changes made since staging. Avoid ad hoc dual writes.
9. **Promote only after gates pass.** Record actual source commit, schema/import version, target project/deployment ID and verified production origin. Retain the old deployment and backup for an owner-agreed rollback window. Production promotion, any paid provisioning and retirement are separate decisions.

Prefer additive/backward-compatible migrations and a prior compatible frontend deployment for rollback. A frontend rollback does not undo database writes. Freeze the affected new writes, preserve/export post-cutover changes and reconcile them before returning users to an old system; never silently strand new visits/notes there. Verify actual restore/PITR availability and retention for the selected Supabase plan rather than assuming it. Do not delete the legacy app/database or destructively roll schema back automatically.

## 9. Phased vertical slices and exit gates

| Phase | Usable vertical slice | Exit evidence / dependency |
|---|---|---|
| 0. Recovery and baseline | Known source tree, backend, assets/licenses, data inventory and fresh desktop/phone interaction capture | Archive/repository bytes, authorized backend access and site egress. Produce actual-path mapping and reconciliation baseline before replacement. Currently blocked. |
| 1. Private shared workspace | Naim and Kerem sign in separately and share one protected sample trip across sessions | Isolated Fieldwork target, verified identities/callbacks, owner bootstrap authorization. A01–A06, RLS outsider/second-workspace attacks and no secret exposure pass. No outbound invite until separately authorized. |
| 2. Territory → City | Imported or preserved cities/corridors/leads appear; city selection shows evidence/history and separate Add to trip | Baseline reconciled; U01–U05 and E01–E02 pass at desktop/phone/keyboard. Missing venue/food data remains truthful. |
| 3. One-city real day | Confirm private origin, pick exact sources, obtain road geometry, display source windows/work/meal/loading/return | Approved provider key/spend/terms; R01–R03 and fixtures A/B/D pass. Provider failure displays route unavailable and prevents verified timing. |
| 4. Overnight and crew | 0–3-night presets with hotel-linked days, real zones, rest and solo/together/resource conflicts | T03–T07, hotel endpoint recomputation and overlap tests pass. No implied cadence/second vehicle. |
| 5. Results and scenario decisions | Durable visits/notes/costs inform overnight/car/truck comparisons | A05, E03–E05 and rental logistics/capacity checks pass; unknown estimates remain incomplete. |
| 6. Migration rehearsal and owned release | Reconciled staging imports/restore, deployed isolated preview, authorized final sync and production verification | M01–M05, A06 and S01–S03 with real identifiers. Explicit implementation, provisioning if needed, invitation and cutover permissions precede those actions. |

Use existing scripts and pinned tooling if recovered. Otherwise define and pin the replacement's actual scripts during implementation. No package-manager test/build command is reported as passing here: there is no package.json. Tests/CI should use synthetic isolated workspaces; remote checks must prove their target is nonproduction before mutating anything.

### Acceptance test ledger — all application cases are NOT RUN

The full supplied contract is [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md). Required cases include:

| Area / IDs | Observable pass condition |
|---|---|
| Recovery/import M01–M05 | Actual source/backend evidence, complete per-entity reconciliation, deterministic import twice, no collateral changes, readable backup plus staging restore and protected cutover/rollback. |
| Identity A01–A06 | Invite-only real auth/recovery/refresh/logout; both partners share; anon/outsider/other workspace denied through direct clients/APIs; role/tenant/FK attacks denied; private keys absent from bundles/logs; cross-device/conflict/idempotent saves and isolated deployed callbacks. |
| City/access U01–U05 | Marker/list/touch opens CITY panel without adding a stop; marker-over-route priority; draft preserved; editable approximate Affton/Lakeshire → confirmed private origin; measured AA text/non-text and usable focus/44px targets at 390, 768 and 1440 widths. |
| Road routing R01–R04 | Live provider geometry/legs for exact origin, sources, local transfers, hotel/depot and return; reorder consistency; stale-response rejection; missing key/timeout/429/no-route/snapping/waypoint failures; no fake path; truck restrictions honestly unresolved where unsupported. |
| Time T01 | Synthetic Fixture A: 06:00 departure, 150-minute outbound, setup, three stores/local transfers in one four-hour city window, meal and explicit extra loading, 150-minute return → **16:45**. Adding another four hours must fail. |
| Time T02 | Fixture B: second full city → **21:30**, violating the 18:00 deadline by **210 minutes**; preserve work durations and show the conflict. |
| Time T03–T07 | Full visits fit actual split/dated/appointment windows; unknown hours provisional; 0/1/2/3 hotel nights connect day endpoints; DST gaps/folds handled. Fixture D: 09:00 Chicago + three elapsed hours → **13:00 Indianapolis** on 2026-10-01. Crew/resource conflicts without invented productivity. |
| Evidence E01–E02 | Halal statuses/scope/source dates accurate or empty; retail Goodwill/HPB excluded by default, outlet separately typed and trip-specific overrides audited; expired events and city leads never treated as confirmed stores. |
| Economics E03–E05 | Fixture E: hypothetical 500 contribution less 100 shared trip cost → **400**, then **40/person-hour** solo or **20/person-hour** together, unchanged shared cost. Unknowns not zero. Fixture F: solo destination truck pickup with two returns/no transfer is infeasible; payload and volume both checked. |
| Engineering/release S01–S03 | Record actual lint/type/unit/integration/RLS/build commands and outcomes; real browser city/day/multi-night screenshots at desktop/phone; verified preview/production/config identifiers. Mocked provider tests remain separate from live-provider tests. |

Fixture numbers are synthetic acceptance inputs, not researched travel/business estimates. Record each run's date, target, input, command/tool, actual result and evidence. Failed, skipped, blocked and unrun cases stay distinct from passed cases.

## 10. Exact outstanding inputs and permissions

| Missing input / decision | What it blocks | Required next action |
|---|---|---|
| Original source archive bytes or populated Fieldwork repo/ref | Actual module-level audit, dependency/license inventory and retain/rebuild decision | Make the discovered export available to this task or identify an accessible populated ref. Earlier sandbox links alone are insufficient. A text clarification was requested while planning continued. |
| Reference-site egress | Current desktop/mobile/keyboard/contrast audit and public-asset/config observations | Allow fieldwork-book-sourcing.naimozduman.chatgpt.site through this environment's supported settings/proxy flow. Discover any additional asset/API hosts from successful authorized requests. No allowlist was changed. |
| Current documentation egress | Verified provider prices/limits/licenses and framework/auth conventions | Needed observed hosts: docs.mapbox.com, www.mapbox.com, supabase.com, vercel.com. Keep existing network policy entries; no broad wildcard or direct-proxy bypass. |
| Fieldwork-specific backend ownership/read/export access | Confirmation of D1 or other backend; private row counts/data/identity mapping | Provide authorized read-only project access or a private export with schema and provenance. Resolve actual account/database/binding IDs first; do not send secret values in chat. |
| Dedicated Fieldwork Vercel/Supabase ownership and isolated preview target | Auth/deployment integration and staging rehearsal | Verify existing Fieldwork resources before creating any. Commercial Vercel use/plan eligibility, Supabase quotas/backup options and SMTP costs need current verification; obtain specific approval for any paid provisioning. |
| Naim/Kerem verified emails and owner bootstrap mapping | Real accounts, legacy ownership and eventual invite/recovery delivery | Proposed Naim owner/Kerem partner is reversible until identities are verified. No invitations are authorized or sent by this plan. |
| Approved provider account/token scopes and spending ceiling | Live routes/map loads and current licensing/cost acceptance | Secure configuration later, after rates and restrictions are checked. No key values requested in chat; no unlimited/free assumption. |
| Exact origin and real trip inputs | Reliable ETA/Ready itinerary | User confirms editable private base pin, dates/deadline, sources/hours and any hotel/transport details at planning time. Provisional Affton/Lakeshire is an area, not a guessed address. |
| Vehicle capacities, quotes, driver/transfer constraints and source yield/cost evidence | Credible overnight/truck/economic comparison | Enter verified current facts when needed; leave unknowns explicit. No booking, venue contact, rental price or profitability claim is part of this task. |
| Subsequent goal prompt plus specific production actions | Implementation, migrations, paid resources, outbound invitations, cutover | Stop after these documents. Obtain the separate implementation instruction and required action-specific authorization before acting. |

Resolved by the brief and not reasked: target Vercel/Supabase, distinct shared-workspace accounts, preferred together/solo crew, trip duration choices, 3–5-hour city window, exact road geometry, source exclusions, restrained style, and plan-only scope.

**Current result:** documentation and access diagnosis completed; original source, complete data, D1 existence and live UI behavior remain unverified. The next work is recovery/audit once access is available, not immediate scaffolding.

## Implementation follow-through — 2 October 2026

The later implementation prompt superseded the earlier plan-only scope. The gates/evidence above remain historical. Source recovery is still blocked, so the current Next.js/React/TypeScript tree is a working reconstruction extended from the initial v2 source present at implementation start; it is not a claimed recovery of the ChatGPT project's original framework/assets/backend.

Actual modules now exist: `src/lib/model.ts`; pure `src/lib/planning/{schedule,time,transport,economics,draft,add-city}.ts`; `src/lib/routing/{mapbox,revision,city-estimate}.ts`; SSR/browser environment/auth adapters; workspace-scoped API routes for data/catalog/settings/trips/visits/notes/routes/city estimates; city/list/map/trip/results components; three versioned Supabase migrations; normalized legacy inspector/importer, verified-account bootstrap and deployment checks; local Auth/RLS/API/unit/import/browser tests; environment/Vercel/CI templates. See PROJECT_STATE.md, MIGRATION_RECONCILIATION.md and OPERATIONS.md for actual validation and remaining gates. The original guidance and requirements above were preserved.
