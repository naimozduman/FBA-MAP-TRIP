# Fieldwork v2 — project state

Last updated: 2026-10-01

## Current handoff status

**Specification/handoff only. Implementation has not begun in this package.**

Verified from the public page: the existing Fieldwork site is reachable through web retrieval, advertises 15 corridors and 108 places, uses a St. Louis base label, presents a corridor-oriented detail view, and labels its routes as planning sketches.

Also inspected: the Library's Fieldwork site artifact text, which lists the regional city network and existing navigation. That is a rendered-content artifact, not proof of possession of the complete source code or backend.

Not verified: source framework, repository location, exact data schema, backend credentials, original source archive availability, current database row counts, existing auth behavior, numerical contrast ratios, live marker click propagation, map provider implementation, or Vercel/Supabase project configuration.

A local browser capture was attempted but the container could not resolve the site's hostname. No browser screenshots, visual contrast measurements, or rendered-interaction test results were obtained. Do not present the public text inspection as a completed visual audit.

Earlier conversation context reported Cloudflare D1 and an export called `Fieldwork-source.zip`; these are discovery leads, not verified resources or paths in this handoff.

## Artifacts completed

Plan prompt; goal/implementation prompt; AGENTS.md; product spec; trip rules; migration/security requirements; acceptance tests; source/evidence notes; this state file.

## Work not performed

No source recovery/export, source edits, SQL migrations, cloud resource creation, login creation, invitations, deployment, route-provider integration, data import, or bookings.

## Next executable action

Inspect the authorized original Fieldwork project/source export, confirm the actual persistence layer, and produce `IMPLEMENTATION_PLAN.md` with real code paths and dependencies. Use `01_PLAN_PROMPT.md`.

## Implementation progress table

| Area | State | Evidence |
|---|---|---|
| Original source and data recovery | Not started | None |
| Baseline visual/interaction audit | Partial | Public page text only; browser capture unavailable |
| Vercel/Supabase architecture | Proposed | docs/MIGRATION.md |
| Auth and workspace RLS | Not implemented | None |
| City-first map and road routing | Not implemented | None |
| Feasible multi-day scheduling | Not implemented | None |
| Source/halal evidence model | Proposed | docs/PRODUCT_SPEC.md |
| Imports and reconciliation | Not implemented | None |
| Automated/browser/security tests | Not run | Acceptance cases defined only |
| Preview/production deployment | Not performed | None |

## Decisions requiring evidence or owner input

Exact private base pin; original source/data access; intended Fieldwork cloud project ownership; account emails for invitation; approved map/routing provider and spending allowance; current vehicle capacity/operating costs; live source/halal verification. Do not ask for secrets in chat. Resolve available context and connected-tool access first.
