# Evidence, sources and assumptions

Research date: 2026-10-01. Recheck provider/platform documentation and all venue/travel facts during implementation. These references support the technical requirements, not a claim that the code already exists.

## Directly observed baseline

Public page: https://fieldwork-book-sourcing.naimozduman.chatgpt.site/

Web text retrieval displayed Fieldwork, a St. Louis base label, 15 corridors and 108 places, corridor-focused details, trip/visit actions, and an explicit planning-sketch disclaimer. The Library's matching Fieldwork site artifact also exposes a regional city list. Those observations justify preserving the territory and correcting the interaction/scheduling model; they do not reveal the complete original source or database.

No numerical contrast measurement or live browser interaction audit was completed. A browser capture attempt could not reach the hostname from the container. The user's reports about low visibility, straight-line routing and awkward trip timing are requirements; they are not presented as independently measured UI defects here.

## Locality assumption

Official City of Lakeshire information: https://lakeshiremo.gov/about-lakeshire/

The user said “Lake Shire” and “Athens.” Affton/Lakeshire is the provisional interpretation. It is not a verified home address; onboarding must allow correction and a confirmed departure pin.

## Routing and rendering references

- Mapbox Directions: https://docs.mapbox.com/api/navigation/directions/
- Mapbox Matrix: https://docs.mapbox.com/api/navigation/matrix/
- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js/guides/

Directions provides drivable route geometry/leg information; matrix results are travel-time/distance inputs, not a geometry substitute. The proposed provider choice remains subject to recovered architecture, account access, current licensing and costs. This package contains no route-provider results, keys, real-city driving estimates or rental quotes.

## Accessibility references

- W3C text contrast: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- W3C non-text contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html

Use these to measure actual rendered states. A stylistic preference or attractive screenshot is not a contrast audit.

## Supabase references

- SSR/auth client guidance: https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs
- Row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Changelog index to recheck: https://supabase.com/changelog.md

The SSR and RLS documentation was retrieved. The lightweight changelog URL returned an unsupported Markdown content-type error in this research tool; its contents were not inspected. Recheck it with an appropriate client during implementation and investigate applicable breaking changes. Do not assume the old project's exact package versions or middleware conventions.

## Deployment and persistent agent guidance

- Vercel environments: https://vercel.com/docs/deployments/environments
- Codex AGENTS.md: https://developers.openai.com/codex/agent-configuration/agents-md
- Codex best practices: https://developers.openai.com/codex/learn/best-practices
- Execution-plan reference: https://developers.openai.com/cookbook/articles/codex_exec_plans

AGENTS.md is project guidance; the accompanying specs carry the larger task detail. The prompts deliberately separate plan-only inspection from implementation. Vercel preview/production configuration is a release design requirement, not evidence of an existing connected deployment.

## User-supplied or previously expressed constraints

The current request supplies real-road routing, stronger visibility, city-click descriptions and halal discovery, several stores per city, approximately 3–5 hours sourcing per city, Naim/Kerem or solo operation, 0–3-night options, optional U-Haul logistics, Vercel/Supabase/login, and a corrected south-county base.

Previously expressed context supplies the low-cost sourcing strategy, default exclusions of regular Goodwill retail and Half Price Books, non-purple/non-blue-led styling, and preservation of the existing regional territory. Treat older price/vehicle assumptions as editable and verify before applying them to a real trip.

Earlier assistant context mentioned a Cloudflare D1 backend and Fieldwork-source.zip. Neither the backend nor the archive was directly verified in this task. They are source-discovery leads only.

## No unsupported live business data

No restaurants, bookstores, current sale dates/hours, truck capacities/rental rates, profitability results, home coordinates, driver eligibility or lodging availability have been researched and approved for direct seeding here. Test fixtures are explicitly synthetic. “Gold mine” is a proposed evidence question, not a claim about any city.
