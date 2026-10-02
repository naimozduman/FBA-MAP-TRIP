# Acceptance contract

A specification is not a test run. Every case starts **not run** until the implementation records the environment, date, input/fixture, expected/actual result and evidence. Mark mocked-provider versus live-provider results separately. Use synthetic data only in isolated tests.

## Baseline, recovery and migration

**M01 — recovery inventory.** The agent identifies actual framework/runtime, source location/version, persistence layer and auth behavior from accessible files/config. Unknowns remain unknown. A saved HTML file alone cannot pass complete source recovery.

**M02 — data preservation.** Inventory unique cities/places, corridors and memberships separately; compare the site's advertised baseline with recovered records. Preserve all recoverable source leads, trips, stops, visits, notes and settings. Record deduplication/missing-data decisions and legacy ID mapping; do not silently delete or invent records.

**M03 — import rerun.** Run the same migration/import twice in staging. The second run introduces zero duplicates or unintended changes. Invalid/orphaned records are flagged in a durable report.

**M04 — no collateral change.** Only the authorized Fieldwork repository, deployment and data boundary change. Other Naim applications and the original deployment remain untouched until an explicit cutover action.

**M05 — restore and cutover.** Demonstrate backup readability and staging recovery. Document the final-delta/write-freeze strategy and rollback, including how writes are protected across frontend rollback.

## Identity, data access and reliability

**A01 — real login lifecycle.** An invited user signs in, survives reload/refresh, signs out, cannot reopen protected data while signed out, and completes the configured recovery flow. UI-only mock sessions fail.

**A02 — partners share; outsiders do not.** Naim and Kerem access their shared workspace. A signed-in nonmember, a user in another workspace, and a signed-out client cannot read/write its trips, notes, settings, source observations, food notes, or private origin through direct API requests.

**A03 — no privilege escalation.** A partner cannot add themselves to a different workspace, self-promote, change an object to another workspace or attach a foreign-workspace source/vehicle. Test inserts, updates, deletes and malicious ID substitution, not just list filtering.

**A04 — privilege exposure.** No privileged Supabase or routing secret appears in client assets, public environment variables, committed files or logs. Review view/RPC/storage access and any service-role endpoint separately from ordinary table policies.

**A05 — durable and concurrent saves.** Create a trip on one device/session; read it on another. Concurrent edits are versioned or conflict-handled without silent data loss. Retrying a visit/expense save does not duplicate it. Offline/unsynced state is explicit and private caches clear on logout.

**A06 — deployment environment.** Preview and production use intended isolated data and callback URLs. Authentication and authorized data access work on the deployed URL, not only localhost.

## City exploration and visual access

**U01 — city click.** Clicking a city marker opens that city's brief, source opportunities, food evidence and visit history. It does not open a corridor detail or add a trip stop. Repeat for keyboard/list selection and mobile touch.

**U02 — hit priority.** A city/stop marker on top of a route remains clickable. Closing the city panel preserves trip draft and selection. Selecting a route leg can show its own detail without replacing city behavior globally.

**U03 — origin.** The initial area is marked approximate Affton/Lakeshire, not confirmed downtown St. Louis. Changing/confirming the base recalculates relevant routes/ETAs; exact coordinates are not exposed in public data. An unconfirmed origin prevents Ready status.

**U04 — contrast.** Measure normal text >=4.5:1, qualifying large text >=3:1, and essential non-text controls/graphics >=3:1 in their actual rendered adjacent states. Include marker selection, labels, inputs, focus, buttons and error states; do not claim measurement from visual impression alone.

**U05 — responsive use.** Verify at a 390px-wide phone viewport, 768px intermediate layout and 1440px desktop. No obscured primary actions, trapped scroll, unreadable route/stop labels or unintended horizontal page overflow. Map actions have an accessible list path, focus management and comfortable targets.

## Road routing

**R01 — real round trip.** For a confirmed origin, multiple exact source addresses, chosen hotel if applicable and home return, a live provider returns per-leg road geometry, miles and duration. Compare representative geometry/legs with provider output. Merely showing a detailed basemap or many interpolated points does not pass.

**R02 — reorder and stale responses.** Reordering a stop updates the route and schedule consistently. Rapid reorder/origin changes cannot let an older network response overwrite the newest plan.

**R03 — failure and limits.** Missing key, timeout, rate limit, unreachable point, excessive snapping and provider waypoint overflow show useful explicit states. No straight line is silently substituted as a drivable route. Respect cache/attribution terms and label stale data.

**R04 — vehicle profile honesty.** A truck scenario does not assert that standard car routing verifies height/weight clearances. Model unsupported restrictions as needing validation; do not silently switch the route profile label.

## Time, days and feasibility

**T01 — detailed city, no double count.** Use Fixture A in TRIP_RULES.md: multiple stores/local transfers form one four-hour city window and final home arrival is 16:45. Adding a second four-hour aggregate block fails the test.

**T02 — impossible second city.** Use Fixture B: home arrival is 21:30, violating an 18:00 hard deadline by 3h30m. The UI states the conflict and preserves requested source durations instead of shrinking them.

**T03 — actual windows.** Test closing during a requested visit, a lunch closure, a dated sale, an expired event, appointment-only entry and unknown opening hours. Unknown hours must not become all-day availability; a visit cannot continue past a hard closing window without warning.

**T04 — nights and hotels.** All four duration presets yield explicit dates and 0/1/2/3 lodging nights. A selected hotel is the end of day N and origin of day N+1. Arrival/check-in/rest/checkout and next-day opening windows all affect feasibility. Deleting or relocating a hotel recomputes both affected days.

**T05 — zones and daylight saving.** Fixture D gives 13:00 local destination arrival from 09:00 Chicago plus three elapsed hours on the fixture date. Test ambiguous/nonexistent local times around daylight-saving transitions. Do not assume every Indiana/Kentucky city shares a zone.

**T06 — status precedence.** Missing key inputs makes a draft provisional; a known violated hard constraint is still surfaced as infeasible. Tight/feasible labels expose buffer assumptions and are not treated as safety guarantees.

**T07 — crew and resource assignment.** Switch between Naim solo, Kerem solo and together. Costs for one shared vehicle are not doubled; yields/time are not magically scaled. Parallel-trip drafts detect overlapping person/vehicle assignments without imposing a weekly cadence.

## Evidence, food and economics

**E01 — halal provenance.** City food entries show source, checked date and certification/business/community/unverified status correctly. Cuisine alone never passes verification. No-results produces a truthful empty/search state rather than fabricated places.

**E02 — source filters and freshness.** Regular Goodwill retail and Half Price Books are excluded by default. Outlets are separately typed. Explicit overrides persist. Old sale dates and stale hours remain flagged; city leads are not counted as confirmed stores.

**E03 — economic accounting.** Fixture E returns $400 pre-labor contribution, $40/person-hour for one ten-hour participant and $20/person-hour for two, with unchanged $100 shared vehicle cost. Acquisition/prep costs and inclusive mileage/fuel are not double-counted. Unknown inputs do not become zero.

**E04 — projection honesty.** Acquired-book projections are not labeled realized sales profit. Opportunity ratings expose observation dates/sample size; untested cities cannot receive fabricated yield, inventory, competition or profitability values.

**E05 — rental feasibility.** Fixture F flags a solo two-vehicle return with no transfer plan. Test payload and volume separately, passenger/gear allowance, rental pickup/return windows, extra vehicle fuel and added handling time. No reservation or purchase occurs automatically.

## Ship evidence

**S01 — engineering checks.** Record actual lint/type/build/unit/integration/RLS/browser test commands and results. A skipped/failed test is not passed. Test isolation must prevent production mutations.

**S02 — visual check.** Capture real browser screenshots of Explore city, Trip day view and a multi-night itinerary at desktop and phone sizes. Image-generation mockups or HTML inspection cannot substitute for browser evidence.

**S03 — deployment claims.** Report only actual repository/commit and verified preview/production URLs. Distinguish source recovered, code implemented, data migrated, deployed and live-provider verified. A preview with missing auth/provider configuration is a partial milestone, not finished production.
