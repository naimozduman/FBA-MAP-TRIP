# Fieldwork v2 — product specification

## 1. Outcome

Turn Fieldwork from a regional route illustration into Naim and Kerem's private sourcing-operations application. A successful session answers: Where should we source? Which actual sources can we visit on these dates? Can the plan fit? Who is going? How much time/cargo/budget is needed? What evidence justifies a longer stay? What happened on the trip?

The public reference is https://fieldwork-book-sourcing.naimozduman.chatgpt.site/. Reuse useful content and identity, but do not preserve incorrect route or scheduling behavior.

## 2. Objects that must remain distinct

A **corridor** groups cities for discovery. A **city** is a geographic locality, not a bookstore. A **source** is a store, library sale, charity outlet, church/estate event organizer, or other buying opportunity. An **event** is a dated opportunity at a source/location. A **trip** is an executable itinerary with participants, vehicles, dates, stops, lodging, and an origin/return. A **visit** is an actual outcome, not just a scheduled stop.

One city may belong to several corridors. One city may be visited twice on the same trip. A source can have recurring events with changing times/addresses. Never deduplicate different states' cities solely by name.

## 3. Navigation and map

Retain recognizable Fieldwork branding. Recommended primary areas are Explore, Trips, Visits/Results, and Settings; corridors are a filter within Explore, not the default detail object for all clicks.

**Explore mode:** city markers and city/source discovery. Do not show a spaghetti overlay of all corridor lines. A selected corridor filters/highlights its cities; conceptual territory sketches, if retained, are explicitly labeled and visually subordinate. City markers remain independently selectable. Clicking empty map space must not destroy an unsaved trip draft.

**City panel:** name/state, short sourced description, why it might be relevant for book sourcing, nearby clusters, estimated drive time from the selected origin, opportunities with evidence, verified/unverified food options, and visit history. Opening it must not add a trip stop. Provide a separate Add to trip action with a city work-window placeholder or chosen source stops.

**Trip mode:** an actual ordered itinerary and road-following geometry. Selected city, selected stop, and selected route leg are separate UI states. Clicking a marker takes priority over underlying line hits; selecting a line can show its own driving-leg detail without hijacking city interaction. A city reached from the trip list still opens the same city panel.

Use selected-route casing, marker outlines, route day numbers and a legend so meaning is not color-only. Outbound/local/return segments remain distinguishable. Offer Fit trip and Return to base controls. Do not recenter on every rerender or data refresh. Persist a sensible viewport preference without storing private coordinates in a public bundle.

On mobile use an accessible bottom sheet and visible close/back control; on desktop use a readable side panel. Both need keyboard/list alternatives, scroll handling, focus management, and no overlay that permanently hides the selected marker.

## 4. Contrast and visual direction

Preserve an understated earth/neutral identity: warm light surfaces, near-black text, clear boundaries, and restrained green/amber/rust accents are a proposed direction, not a mandatory token palette. Avoid purple/blue-led branding and glassy translucent surfaces that weaken map readability.

Measure actual rendered contrast: normal text >=4.5:1; qualifying large text >=3:1; necessary control boundaries, icons and graphics >=3:1 against adjacent colors. Aim for 44 CSS-pixel interactive targets where practical. Test selected/hover/focus/disabled/error states, not only the default screen. Disabled-state appearance must not make enabled controls look disabled. Distinguish values, labels, and supplementary notes through hierarchy without making necessary details faint.

Keep roads and city labels readable at appropriate zoom levels. Separate the decorative basemap from app-owned information: basemap labels alone cannot be the only accessible representation of a selectable city or stop. Use clustering/density control and a text list instead of overlapping dozens of labels.

A high-contrast light map is the v2 priority. Add dark mode only when both modes can be verified, rather than multiplying untested variations.

## 5. Origin

Use “Affton / Lakeshire area — approximate” during onboarding as an explicitly provisional locality. The user can search an address, choose a map pin, or edit coordinates. Validate geocoding precision and require a confirmed actual departure point before Ready status. Do not silently revert to downtown St. Louis or assume any older private address is current.

Store the origin in private workspace settings. Allow a different trip-specific origin/return, such as a warehouse, with a visible indication that it differs from home. Do not leak origin coordinates in public share views or unrestricted route caches. Map-provider requests necessarily include routing coordinates; disclose this and send only what is needed.

## 6. Source and event detail

Capture address and geocoding confidence, category, hours/time zone, dated events and exceptions, known purchase prices or ranges, last verified date, source URL, contact/action notes, restock observations, user notes, and actual visits.

Library sales, independent sellers, outlets, thrift/charity/church/estate/rummage sources and relationship pickups are eligible. Keep regular Goodwill retail and Half Price Books excluded by default. Model outlets separately rather than accidentally blocking or enabling an entire corporate brand. Persist explicit filter overrides.

Previously expressed price targets were generally <=$1/book and exceptional buys <=$2. Treat these as editable scouting filters, not verified current prices or an automatic buy rule. Preserve the current small-book/car-based approach; do not silently substitute a bulk-textbook operation. A truck is an optional logistics scenario triggered by evidence.

A lead without an address is a discovery lead, not a routable confirmed stop. A source without reliable hours is unconfirmed, not open all day. A past sale is not automatically recurring this year. Missing volume, competition, sell-through and pricing remain unknown.

## 7. Halal eating options

Restaurant records should include identity, city/address, cuisine as a descriptive field only, phone/site/menu link, opening windows, last check, source URL, and an evidence status:

- Certified: identified certifying source and date/scope where available.
- Business-stated halal: statement from the restaurant, with scope and check date.
- Community-reported: attributable report; not independently verified.
- Unverified/needs confirmation: discovery lead or stale/uncertain evidence.

Certification, business claims, and community reports are not interchangeable. Never infer halal from Middle Eastern, Turkish, Indian, Mediterranean, vegetarian, or Muslim-owned labels. Partial halal menus and mixed kitchens should be represented accurately when known. Vegetarian alternatives are not relabeled as verified halal restaurants.

Show where to eat, why the halal label is present, whether the expected meal window fits, and the added drive from planned stops. Search links can be offered as discovery actions but cannot masquerade as verified businesses. Do not seed invented restaurants merely to fill every city panel. No live restaurants were researched or supplied in this specification.

## 8. Proposed data model

Adapt to the recovered schema; names below are conceptual, not assertions of existing tables.

| Domain | Suggested entities and relationships |
|---|---|
| Identity | profiles, workspaces, workspace_members, workspace_settings |
| Territory | cities, corridors, corridor_cities |
| Opportunities | sources, source_events, source_hours, evidence_records |
| Food | food_places, food_evidence; optionally a typed place table when justified |
| Planning | trips, trip_participants, trip_days, city_visits, trip_stops, route_legs |
| Resources | vehicles, trip_vehicle_assignments, lodging_stays, rental_scenarios |
| Outcomes | source_visits, visit_metrics, trip_expenses, notes |
| Reliability | import_runs, legacy_id_map, change/audit events where useful |

Private/business entities include workspace_id with scoped foreign keys or equivalent database constraints. A stop cannot reference another workspace's trip/source/vehicle. If public catalog data is separated from private notes, test that public access cannot reveal private joins. Prefer a fully private v2 catalog unless a public sharing feature is deliberately built.

Use stable IDs, source/verification timestamps, updated_at/version fields for optimistic concurrency, explicit units, integer minor currency units, UTC instants plus IANA time zones, and origin provenance. Store rough estimates with a type/confidence/source rather than mixing them with measured values.

Trip saves/reorders should be atomic. Reject stale conflicting edits with an actionable reload/merge flow instead of silently overwriting a partner's changes. Use idempotency keys for retried visit/expense creation. Local draft persistence may help intermittent connectivity, but it is not shared canonical storage; show unsynced state and clear private caches on logout.

## 9. Results and evidence

Log source visit date, participant(s), elapsed sourcing time, books scanned/bought, purchase cost, estimated book contribution assumptions, loading/local travel time, and notes. “Didn't buy” is a meaningful result and must not be discarded.

Aggregate repeatable observed metrics: bought per visit/hour, average paid per book, dead-stop rate, actual trip costs, contribution estimate per person-hour, and recency/sample count. Estimated contribution remains estimated until supported by sales/cost data; realized FBA profit is not available merely because a book was acquired.

Opportunity labels should reflect evidence: untested, promising, repeatable based on visits, or bulk opportunity requiring confirmation. Display sample size, dates, inputs and caveats. Avoid invented 0–100 “gold mine” or saturation scores. A city with many stores and no visits is not demonstrated profitability.

## 10. Non-goals and scope discipline

No native app, public social network, Amazon scraper, full inventory ledger, autonomous booking, mass marketing, or forced integration with the user's other apps. Mobile-responsive web comes first. Push notifications, offline map downloads, fleet optimization, and advanced AI recommendations are later features, not prerequisites for a truthful working v2.
