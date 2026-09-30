# Backend

| Path | Responsibility |
|---|---|
| `app/api/hunt/research/route.ts` | Research orchestration/cache |
| `lib/bounded-cache.ts` | Owner-scoped research TTL/LRU and byte budget |
| `app/api/hunt/research-runs/` | Owner-scoped archive of completed research runs |
| `app/api/hunt/research-runs/[runId]/checks/` | Owner-scoped falsification questions and classified, dated outcomes |
| `lib/counter-evidence.ts` | Validation and limits for counter-evidence records |
| `lib/research-run-store.ts` | Owner-scoped run history, atomic save, and 20-run retention |
| `lib/research-engine.ts` | Input schema, grouping, scoring |
| `lib/validation-plan.ts`, `components/research/validation-plan.tsx` | One prioritized evidence action; remaining questions collapsed |
| `lib/economics.ts` | Scenario calculations |
| `lib/revenue-models.ts` | Revenue archetypes, working capital cycle, India scale targets, and stress testing |
| `lib/investment-risks.ts` | Budget and downside flags from explicit inputs |
| `app/api/hunt/leads/` | Authenticated owner-scoped dossiers/evidence |
| `db/schema.ts`, `drizzle/` | D1 schema/migrations |
| `app/api/news/route.ts` | Independent RSS endpoint |

## Research

Submit -> prepare query -> fetch -> group evidence -> compare.

- HN, Stack Overflow, GitHub alternatives, Brave web, Places, Census, and optional supplied webpages run as independent collectors. Optional providers require server credentials; provider limits and failure handling live in `lib/collectors/`.
- Research gate: 2 active and 6 queued requests per isolate; cancellation removes queued work, queue full returns 503.
- Discussion, web snippets, place listings, repository activity, and establishment counts remain distinct from buyer proof. Places/Census are refreshed per research action; web results are transient.
- Completed research: owner-scoped D1 snapshots; save and 20-run retention share one batch. `GET /api/hunt/research-runs` returns newest-first history (max 20); startup restores newest run. Browser snapshot remains fallback; assumption edits stay local until a rerun.
- Optional supplied webpages: [collector](../services/collector/README.md).
- Legacy dossiers and evidence: owner-scoped D1, `/hunt/legacy`.
- Preserve URL, provider, dates, excerpt, and claim provenance. Discussion activity never proves sales.
- Unknown stays missing. Separate sourced values, estimates, and hypotheses.
- D1 dossiers store validation status, observation date, user note, and optional HTTPS proof link. User-reported outcomes are not independently verified sales.
- Apply all local migrations with `npm run db:local:apply`; migration files are ordered in `drizzle/`.

## Calculations

| Metric | Formula |
|---|---|
| Revenue | price × monthly units |
| Contribution/unit | price − variable cost |
| Operating profit | contribution × units − fixed costs |
| Operating margin | profit / positive revenue × 100 |
| Break-even units | ceil(fixed costs / positive contribution) |
| Initial funding | setup + equipment + inventory + reserve |
| Payback | months of constant base profit to recover funding |

Require volumes, costs, provenance. Excludes tax, financing, price/working-capital changes.

Strength weights: paid demand 25, recurring pain 20, alternative gap 20, economics 20, budget/location 15. Missing factor => Unrated. Strength != success probability. Confidence separate; local demand unverified.
