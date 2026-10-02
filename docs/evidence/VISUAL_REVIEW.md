# Rendered UI review

2 October 2026. Chromium through Playwright 1.63.0 against the local production build at `/preview`. These screenshots contain unsaved handoff geography, not recovered legacy records. `explore-concept.png` is a generated design reference; it is not evidence of the original app or a working application.

The desktop concept and browser capture use the same 1586 × 992 viewport. The phone capture is 390 × 844. Both final city captures have no horizontal overflow and keep the explicit Add to trip action visible. Desktop Explore fits one viewport; phone geography remains a vertically scrollable page behind the city sheet. Measurement details are in `capture-metadata.json`.

| Area | Concept versus rendered result | Decision / verification |
|---|---|---|
| Identity | Warm paper, forest controls, rust selection, serif Fieldwork/city titles retained. Actual navigation uses smaller typography and more compact spacing. | Keep the restrained functional treatment; measured text/control/focus/marker contrast checks pass. No purple/blue-led dashboard treatment. |
| Geography | The concept includes decorative roads, water and extra city labels. The unconfigured app shows real state boundaries and only six explicit geographic references. | Intentional: the unavailable original data and routing provider must not be represented by invented roads, stores or totals. Configured Mapbox rendering still needs live validation. |
| City panel | Actual details include provenance, nearby references, evidence dates, editable notes and unknowns. These exceed the concept's short content. | Keep a scrollable detail region with fixed city context and visible Add to trip. Verified at desktop and phone sizes; selecting a city does not add it. |
| Mobile | Desktop rail becomes horizontal city buttons; details open a bottom sheet with independent scrolling and a visible close/action button. | Keyboard focus enters the city panel, remains within the open sheet, and returns to the city control on close. No horizontal page overflow. |
| Trip editor | The implementation adds the operational hierarchy, explicit unknowns and a door-to-door timeline beyond the Explore concept. | `desktop-trip.png` shows provisional reasons rather than guessed arrival times. Browser tests verify night presets, solo crew, multiple stores and an impossible two-city day without shortening work time. |

Files inspected visually: `desktop-city.png`, `phone-city.png`, `desktop-trip.png`, plus full-page test captures for day/multi-night editors. Automated browser cases also exercise synthetic provider-returned route geometry, distinguish outbound/local/return legs and discard stale responses. Those fixtures do not validate live Mapbox roads, its current pricing/licensing, rental-truck clearance, or the blocked original site.
