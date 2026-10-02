# Fieldwork v2 — Codex implementation handoff

Prepared for Naim and Kerem • 1 October 2026

## What this package is

A planning prompt, an implementation/goal prompt, persistent agent guidance, product requirements, trip-planning rules, migration requirements, and acceptance tests. This is **not an application source export or an implemented/deployed app**. No cloud resources, accounts, bookings, or existing application data were changed while preparing this package.

Reference application: https://fieldwork-book-sourcing.naimozduman.chatgpt.site/

## Use

Put this package alongside the actual Fieldwork project/source export. Do not overwrite an existing README, AGENTS.md, or project-state file blindly: merge the relevant guidance, preserve existing instructions, and adapt paths if this package remains in a subfolder.

First use `01_PLAN_PROMPT.md` for inspection and a repository-specific plan. Then use `02_GOAL_PROMPT.md` to implement and verify that plan. Both prompts work without the supplemental files, but the files make the detailed requirements durable.

`AGENTS.md` is intended for the Fieldwork repository root only; it must not become a global instruction for unrelated projects. Read `docs/PRODUCT_SPEC.md`, `docs/TRIP_RULES.md`, `docs/MIGRATION.md`, and `docs/ACCEPTANCE.md` before implementation.

## Important assumptions

“Lake Shire, Athens” is interpreted provisionally as the **Affton / Lakeshire area of south St. Louis County**. Exact origin coordinates must be user-editable and confirmed before a trip is called ready. No personal street address is supplied or should be guessed.

The preferred crew is Naim + Kerem in one vehicle; solo is also supported. The wording about “two trips” is not treated as permission to impose two trips per week. Support separate saved trips, and optionally paired trips assigned to different people, without confusing people, trips, cars, or cities.

The original public application advertises 15 corridors and 108 places. Reconcile that baseline against the actual source and database: places can appear in more than one corridor, and a city is not an individual bookstore.

## Contents

- `01_PLAN_PROMPT.md` — read-only inspection and a concrete implementation plan.
- `02_GOAL_PROMPT.md` — implementation, integration, migration, and verification objective.
- `AGENTS.md` — concise durable project rules.
- `PROJECT_STATE.md` — honest initial handoff state; update with evidence as work is done.
- `docs/PRODUCT_SPEC.md` — product, map, city, sourcing, and data requirements.
- `docs/TRIP_RULES.md` — city work blocks, scheduling, overnights, crews, logistics, economics.
- `docs/MIGRATION.md` — source recovery, Vercel/Supabase architecture, security, migration and cutover.
- `docs/ACCEPTANCE.md` — observable pass/fail checks.
- `docs/SOURCES_AND_BASELINE.md` — research sources, evidence limits, assumptions, and verification notes.

## Not requested for v2

A native mobile app, a public travel marketplace, a new Amazon inventory/accounting platform, an autonomous booking agent, or integration with Jarvis/Our Hours/Growth Stats. Make Fieldwork work independently first.

## Implementation update — 2 October 2026

The handoff above is preserved. A working v2 reconstruction is now present in this repository; source recovery, actual legacy migration and owned cloud deployment remain separate unresolved gates. Start with `npm ci && npm run dev`, open `/preview`, and read [docs/OPERATIONS.md](docs/OPERATIONS.md) for real Supabase setup, isolated tests, imports and deployment. [PROJECT_STATE.md](PROJECT_STATE.md) records verified results and limitations.
