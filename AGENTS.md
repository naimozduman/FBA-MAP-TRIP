# Fieldwork project guidance

Scope: this repository only. Merge with existing instructions; never overwrite more-specific guidance or apply this file globally.

## Read first

Read `PROJECT_STATE.md` and `IMPLEMENTATION_PLAN.md` if present. For product changes read `docs/PRODUCT_SPEC.md`; for scheduling read `docs/TRIP_RULES.md`; for data/auth/deployment read `docs/MIGRATION.md`; use `docs/ACCEPTANCE.md` as the verification contract. The prompt selects plan-only versus implementation mode.

## Non-negotiable behavior

- Inspect before replacing. Preserve legacy data and the original deployment until verified cutover. Public HTML is not a backend/source export.
- Fieldwork is an operational sourcing app for Naim and Kerem, not a sightseeing itinerary generator. A city contains many source stops; a corridor is a discovery grouping, not a daily schedule.
- Prefer one primary city/day with an editable 3–5-hour aggregate city sourcing window. Never silently compress visits or double-count city and store durations.
- Preferred crew is two people in one car. Support solo and separate trips. Do not infer two vehicles, double output, or weekly trip frequency.
- City marker clicks open city detail. Road routes require provider-returned geometry; routing failure is visible, never disguised as straight-line driving.
- Affton/Lakeshire is a provisional locality. Never guess a private home address. Exact origin coordinates stay workspace-private.
- Halal status, store hours, sale dates, prices, yield and opportunity claims require provenance. Unknown is not zero, verified, open, free, or profitable.
- Preserve default exclusions for regular Goodwill retail and Half Price Books. Explicit user overrides are allowed and auditable; Goodwill outlets are a separate category.
- No new dependencies/services without a reason. Inspect pinned versions, lockfile, licenses, current docs, and available account permissions.
- Supabase is canonical shared persistence; enforce membership in server code and database policies. Keep privileged credentials server-only. No shared passwords or user-editable authorization roles.
- Do not modify other Naim projects, provision paid resources without approval, book rentals/hotels, contact venues, or invite an unresolved recipient.
- Keep this repository independent of Jarvis, Our Hours, Growth Stats, Iron & Intervals and FBA Ledger unless later explicitly asked.

## Implementation and verification

Use existing package-manager scripts; discover actual commands rather than inventing success logs. Keep scheduling logic pure/testable and route-provider integration behind a small interface. Validate inputs at boundaries. Model UTC instants and IANA location time zones; use integer minor currency units and explicit metric units.

Work in vertical slices. Keep schema changes in reproducible migrations and imports idempotent. Test auth and RLS using nonprivileged clients, including a second workspace and outsiders. Protect tests/previews from production data. Do not weaken tests to make them pass.

Inspect desktop and mobile rendering and keyboard flows. Log the tool, command, date, environment, result, and evidence path for important tests. Distinguish mocked fixtures from real-provider checks. Update `PROJECT_STATE.md` after meaningful changes and at handoff; an unrun test is unverified, not passed.

## Completion

A build is not a deployment; a deployment is not a verified migration; a generated screenshot is not a browser screenshot. Report exactly what is implemented, tested, migrated, deployed, blocked, and not verified, with real identifiers and links. Never invent data, screenshots, credentials, repository paths, commit IDs, or URLs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
