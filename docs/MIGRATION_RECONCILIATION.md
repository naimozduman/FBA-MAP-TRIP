# Migration reconciliation — 2 October 2026

**Actual legacy migration: not performed.** The original `Fieldwork-source.zip` link was located in an authorized earlier conversation, but archive bytes are unavailable. Public site access remains blocked by proxy CONNECT 403. Cloudflare D1 is historically reported and **not independently verified**; no D1 account, binding, schema, export or query was recovered.

| Entity | Reported baseline | Actual recovered rows | Imported legacy rows | Status |
|---|---:|---:|---:|---|
| Corridors | 15 | Unknown | 0 | No source/query semantics or records recovered |
| Places | 108 | Unknown | 0 | Unique-place meaning and duplicate memberships unresolved |
| City/corridor memberships | Unknown | Unknown | 0 | Many-to-many importer/schema implemented; real memberships unavailable |
| Sources / recurring leads / dated sales | Unknown | Unknown | 0 | No venue data fabricated |
| Saved trips / days / stops | Reported feature | Unknown | 0 | No user trip discarded or recreated from guesses |
| Visits / book counts / costs | Reported feature | Unknown | 0 | Zero/negative outcomes must remain meaningful |
| Notes / settings / private origin | Reported feature | Unknown | 0 | No private address guessed |
| Original framework / assets / backend | Unknown | Unavailable | — | New v2 source is a reconstruction, not a recovered export |

Six approximate city references in the unsaved `/preview` are handoff-derived examples and **not imported places**. Synthetic `.test` accounts, QA cities, notes, visits and trips live only in the dedicated local test database. They are never counted toward legacy recovery, assigned to Naim/Kerem's real accounts, or uploaded as production seeds.

The implemented normalized importer is tested twice against synthetic exports: no new canonical rows on rerun, owner edits retained, zero-book results and verbatim notes preserved, two legitimate corridor memberships preserved, conflicting duplicate IDs and orphan references quarantined, raw snapshots retained, stable scoped ID mappings recorded. The original-format adapter cannot be finalized until the actual export is inspected. Supporting a normalized manifest is not proof that an unknown D1/export schema has been migrated.

Unresolved: archive bytes; verified Fieldwork-only backend read/export access; actual place-counter definition; original account/participant mapping; export timestamps/time zones; source licensing/redistribution rights; record reconciliation and staging restore. See OPERATIONS.md for guarded import and cutover procedures. Original site and data remain intact.
