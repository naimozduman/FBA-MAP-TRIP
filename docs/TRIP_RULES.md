# Trip planning rules and worked fixtures

All scheduling defaults below are proposed operational settings, not researched travel estimates, safety guarantees, confirmed venue hours, or promises of sourcing yield. Real plans require live/provider road estimates and current source information.

## 1. Hierarchy and time ownership

Trip -> Days -> City visits -> Source stops. Driving, meals, parking/loading, lodging and rest are explicit itinerary activities. A city visit can contain several stores; it must not be represented as a tiny sightseeing waypoint.

An initial primary-city work window defaults to 4 hours, editable within or beyond the user's suggested 3–5 hours. This aggregate includes in-store time, local repositioning and ordinary parking/loading. It excludes intercity driving, meals, and overnight lodging/rest.

In a coarse plan, reserve that window once. In a detailed plan, replace it with the sum of the actual source/local activity blocks; do not add the original window again. Show any unused reservation as flexible/unallocated time, and any overrun as additional required time. Adding the first store must not erase the rest of the intended sourcing window without making that change visible.

Do not reserve 4 hours for each individual store. Default durations may vary by source type but must be visibly editable and learned from actual history rather than manufactured precision.

## 2. Daily budget and feasibility

Proposed initial controls: editable departure (6 a.m. available), target return/check-in, approximately 12-hour daily active span, 45-minute meal block, and explicit driving contingency. These are tunable planning defaults, not legal driving limits or medical advice. Protect a configurable overnight rest window and flag fatigue/very long driving rather than making an aggressive plan look safe.

For each leg: earliest arrival = previous departure instant + route drive duration + separately displayed contingency. Earliest source start = max(arrival + parking/setup, source window start). Departure = source start + sourcing duration + loading/exit time. Keep those buffer types separate so they are not counted twice.

Validate source activity against actual dated opening windows, including split hours and overnight opening, event dates, appointments, cutoff times, meal choices, lodging availability/check-in constraints, road/rental constraints, and the final return deadline. “Arrive before closing” is insufficient: the planned work must finish before the allowed closing/appointment boundary.

Trip status:

- **Feasible:** confirmed required inputs; no violated hard constraints; configured buffer preserved.
- **Tight:** it fits hard limits but has little configured contingency or exceptionally demanding travel.
- **Infeasible:** a known constraint is broken; identify the activity and minutes or resource conflict.
- **Provisional:** required routing, venue hours, exact origin, lodging/transport details, or other material inputs are missing/unconfirmed. Explicit contradictions still appear as infeasible even when other inputs are unknown.

These labels describe the scheduling model, not guaranteed real-world outcomes. Surface what changed and why after each edit. Never quietly remove meal/rest time, shrink source durations, invent hours, or drop return-home driving.

One primary city/day is a default, not a rigid prohibition. A second city can fit when close and sufficiently productive, but cannot be forced merely because it appears on a corridor. Two or three full 3–5-hour city work blocks require corresponding time; no special “multi-city” exception bypasses feasibility.

## 3. Overnight presets

| Label | Calendar span | Lodging nights |
|---|---:|---:|
| Day trip | 1 day | 0 |
| 2 days / 1 night | 2 days | 1 |
| 3 days / 2 nights | 3 days | 2 |
| 4 days / 3 nights | 4 days | 3 |

Count nights from actual scheduled stays, not by dividing elapsed hours by 24. Show departure and return dates/times prominently. For example, a Friday 6 a.m. departure and Saturday evening return normally describes 2 days / 1 night, not a same-day itinerary with an “overnight” badge.

Each day has its own city groups, stops, road legs, mileage, work time, and end destination. Overnight stays join the two days spatially and temporally: route to the hotel, include check-in/parking/rest/checkout, then route from it to the next source. A hotel search region can support a provisional plan, but cannot become a confirmed hotel/address or exact booked route without selection.

Default to one primary sourcing cluster per day and let measured capacity justify extra stops. Two-day trips may deeply source one metro over both days; they do not require two different cities. Three-night trips are only worth recommending when additional sourcing evidence justifies additional costs/time.

## 4. Time zones

Store UTC instants, IANA zone IDs per location and the intended local source/event time. The workspace home zone is America/Chicago. Resolve actual destination zones through reliable geographic data; do not assume all Indiana or Kentucky uses one time zone, or simply add a fixed hour to every eastern trip.

Compute elapsed durations from instants. Display local arrival time and an explicit zone-change annotation where relevant; optionally display home time as secondary. Handle daylight-saving gaps and repeated times with a deliberate validation/selection flow rather than silently moving appointments.

## 5. Crew and trip alternatives

Crew presets: Naim + Kerem (preferred), Naim solo, Kerem solo. Model people, drivers, vehicles and trips separately. Two people in one vehicle share road mileage; vehicle fuel is not doubled. Their combined labor/person-hours generally are higher than one person's elapsed trip time.

Do not automatically multiply the book yield or halve in-store durations for two participants. Allow a transparent user-adjustable productivity assumption, or use real historical comparisons when enough evidence exists.

Keep multiple saved draft alternatives. Optional paired plans can assign separate trips to Naim and Kerem. They need separate vehicle assignments and must flag person/vehicle overlap. Do not assume the user meant two outings per week or create recurring schedules.

## 6. Route engine contract

Inputs: ordered routable locations and their precision, chosen travel profile, optional departure instant, vehicle restrictions supported by the provider, avoidance preferences, provider/version, and workspace authorization.

Outputs per leg: route status, road geometry, meters, seconds, provider, fetched_at, relevant departure/profile parameters, snapped coordinate quality, and warnings. Distinguish live/typical/static-duration estimates. Never call a static estimate current traffic.

Directions geometry is for drawing the route; a duration matrix can assist candidate ordering but is not a substitute for geometry. Keep an adapter boundary and use only licensed supported integrations. Review active account limits and waypoint limits at implementation time. Segment requests at valid boundaries when necessary and reconcile duplicate shared endpoints without inventing legs. Segmenting a route is not proof of global optimization.

Cache only as permitted; key by ordered points, profile, avoidances, departure/time bucket where appropriate, and provider version. Keep private-origin routes private. Recompute when order/origin/lodging/profile materially changes. Cancel or ignore stale in-flight responses. Local walking/parking changes should not necessarily trigger a full-region requery.

On provider failure show the last saved route as stale if one exists and may legally be retained, or show no calculated route. Do not display a newly drawn straight line as a highway route. Manual road-duration estimates may support a clearly provisional budget, never a provider-verified plan.

Pre-trip city-center estimates are permitted only with an approximate badge; a Ready store itinerary routes to actual access addresses. Wrong-side-of-river results and excessive snapping must be warnings, not quietly accepted GPS points.

Optional route ordering optimizes driving subject to hours, appointment windows, source durations and fixed stops. Never describe a nearest-neighbor heuristic as a globally optimal solution.

## 7. Vehicle and U-Haul scenarios

Personal-car mode and rental-truck mode are separate scenarios. Required fields include usable payload and cargo volume, loading/box assumptions, passenger allowance, booked or estimated rental details, pickup/return locations/windows, rate structure, estimated road miles/fuel/tolls/taxes/coverage and equipment costs, and who drives each vehicle.

Treat dimensions, payload, fuel use, eligibility, availability, parking access and truck restrictions as model-specific and date-specific inputs requiring verification. Do not hardcode a generic “U-Haul capacity” or assume car routing handles bridge clearances.

A rental from home can be a single-vehicle plan. A rental picked up at the destination after driving there in a personal car creates a second vehicle to return. With two people, assign eligible drivers and costs to both. With one person, require a workable transfer/storage/second-trip solution and count its time/cost; otherwise flag infeasible. Do not assume towing compatibility or reserve a tow setup.

Check payload and volume independently, including people/gear and cumulative purchases. Volume-fitting cargo may exceed weight capacity. Estimated books-per-box needs a weight/volume assumption and uncertainty; book count alone is not a payload measure. Warn before capacity is exceeded and plan loading/unloading and a return destination with access.

Do not book vehicles/lodging, pay deposits, buy inventory, or contact sources automatically. A promising source must not turn into a confirmed reservation by changing a label.

## 8. Economics and evidence

Per-book contribution assumption = expected selling proceeds minus acquisition, marketplace/fulfillment fees, prep, inbound freight, and stated reserves that apply. Show precisely which costs this assumption already includes.

Estimated trip contribution before imputed labor = sum of expected acquired-book contribution - incremental trip operating costs (vehicle cost basis, tolls, lodging, rental and other included expenses). Do not subtract acquisition/processing costs again when they are already in the book margin. Do not add fuel and an all-inclusive mileage rate covering fuel for the same vehicle miles.

Contribution per person-hour = estimated trip contribution / total participant hours assigned to the trip. Show elapsed trip hours and combined person-hours separately. Optional hourly labor valuation is a separate view, with its assumption visible; do not hide it inside the denominator or claim it is paid wages.

Unknown inputs produce incomplete/unscored economics rather than zeros. Use explicitly user-entered or evidence-backed low/base/high scenarios; do not create unsupported numerical ranges to fill the UI. Expected book margin is not realized Amazon profit. Acquisition cash spending is not automatically an immediate economic loss, and projected resale is not current cash.

For an extra night/truck decision, compare incremental expected contribution with incremental costs, extra participant time, source confirmation, cargo constraints, and downside. Show Break-even additional usable books = incremental cost / explicitly defined positive per-book contribution, only when the inputs are present and the calculation does not double-count costs. Division by zero/negative or unknown contribution returns unavailable with an explanation.

A “gold mine” claim requires actual source evidence or repeat visits, not metropolitan population. Display observation date, sample count, usable-book results, and confidence. Preserve bad/zero-yield visits in comparisons.

## 9. Deterministic test fixtures — not real itineraries

**Fixture A: one-city day fits.** In one time zone, depart 06:00; drive 150 minutes; 30-minute arrival/setup buffer; source A 09:00–10:15; local travel 15 minutes; source B 10:30–12:15; local travel 15 minutes; source C 12:30–13:00. That is a four-hour city window including local transfers. Meal 13:00–13:45; load 13:45–14:15; drive home 150 minutes; arrive 16:45. Total elapsed = 10h45m. The final loading block is explicitly additional; the test must not add another four-hour city allowance.

**Fixture B: second full city does not fit.** Extend A after loading at 14:15 with 45 minutes to city 2, four hours sourcing, 150 minutes return. Arrival is 21:30. With a hard 18:00 return deadline the plan is infeasible by 3h30m. Do not shrink either city to make it pass.

**Fixture C: 2 days / 1 night.** Make a Friday-origin trip with one selected hotel stay Friday night and return Saturday. Adding or removing that stay changes both daily route endpoints and night count. Keep the next-day opening window and rest requirement explicit.

**Fixture D: time-zone crossing.** Use synthetic locations tagged America/Chicago and America/Indiana/Indianapolis on 2026-10-01. A 09:00 Chicago departure plus three elapsed hours arrives 13:00 Indianapolis local time. Elapsed driving remains three hours, not four. Compute through a time-zone library rather than a hard-coded offset.

**Fixture E: two-person economics.** With synthetic, explicitly hypothetical contribution of $500 and trip cost $100, pre-labor trip contribution is $400. One ten-hour participant gives 10 person-hours and $40/person-hour; two ten-hour participants give 20 person-hours and $20/person-hour when yield is held constant. Vehicle trip cost remains $100 for one shared vehicle.

**Fixture F: solo destination truck pickup.** A solo user arrives in a personal car and collects a truck. If both vehicles must return and no transfer solution is supplied, the transport plan is infeasible regardless of inventory yield.
