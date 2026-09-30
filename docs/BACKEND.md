# Backend

| Path | Responsibility |
|---|---|
| `app/api/hunt/research/route.ts` | Research orchestration/cache |
| `lib/bounded-cache.ts` | Owner-scoped research TTL/LRU and byte budget |
| `app/api/hunt/research-runs/` | Owner-scoped archive of completed research runs |
| `app/api/hunt/research-runs/[runId]/checks/` | Owner-scoped falsification questions and classified, dated outcomes |
| `app/api/reporting/validation-summary/` | Owner-scoped validation and payment aggregates; six D1 reads use one batch |
| `lib/counter-evidence.ts` | Validation and limits for counter-evidence records |
| `lib/research-run-store.ts` | Owner-scoped run history, atomic save, and 20-run retention |
| `lib/research-engine.ts` | Input schema, grouping, scoring |
| `lib/validation-plan.ts`, `components/research/validation-plan.tsx` | One prioritized evidence action; remaining questions collapsed |
| `lib/economics.ts` | Scenario calculations |
| `lib/revenue-system.ts`, `components/research/revenue-system-workbench.tsx` | Product revenue model; break-even sales per offer uses price after refunds, variable cost, and fixed monthly cost |
| `lib/razorpay-sales.ts`, `app/api/revenue/checkout/`, `app/api/webhooks/razorpay/` | Owner-created INR pilot payment links; signed captured-payment webhook records BUSINESSman sales separately from opportunity validation |
| `lib/marketing-automation.ts`, `components/research/marketing-automation-panel.tsx` | Zero-ad-spend growth playbooks (viral hooks, 5-tweet teardowns, executive LinkedIn posts, cold emails, 5-day cadence) |
| `lib/system1-decision-engine.ts`, `lib/layaEngine.ts`, `components/research/system1-triage-panel.tsx` | Explainable System-1 triage; the bounded cache keys buyer, economics, claims, and source IDs so edited evidence gets a fresh evaluation. Triage suggests investigation, not investment. |
| `lib/research-collaboration.ts`, `components/research/research-collaboration-panel.tsx` | Decentralized open-source collaboration, peer falsification bounties, and field counter-evidence reputation scoring |
| `lib/research-bounties.ts`, `app/api/hunt/bounties/` | Collaborative Diligence engine, escrow splits (15% platform fee), and multi-operator consensus scoring |
| `lib/dossier-report.ts` | Executive market dossier generator, Markdown/Report export with scorecard, unit economics and 21-day action plan |
| `lib/investment-risks.ts` | Budget and downside flags from explicit inputs |
| `app/api/hunt/leads/` | Authenticated owner-scoped dossiers/evidence |
| `db/schema.ts`, `drizzle/` | D1 schema/migrations |
| `app/api/news/route.ts` | Independent RSS endpoint |

Saved research stores `schema_version`; bump it only with a reader or migration for older snapshots.

## Research

Submit -> prepare query -> fetch -> group evidence -> compare.

- HN, Stack Overflow, GitHub alternatives, Brave web, Places, Census, and optional supplied webpages run as independent collectors. Optional providers require server credentials; provider limits and failure handling live in `lib/collectors/`.
- Research gate: 2 active and 6 queued requests per isolate; cancellation removes queued work, queue full returns 503.
- Discussion, web snippets, place listings, repository activity, and establishment counts remain distinct from buyer proof. Places/Census are refreshed per research action; web results are transient.
- Completed research: owner-scoped D1 snapshots; each batch keeps the inserted run plus the 19 newest prior runs, independent of timestamp ties. `GET /api/hunt/research-runs` returns newest-first history (max 20); startup restores newest run. The history's **Refresh sources** action reruns saved inputs and bypasses the 10-minute research cache; it saves a new snapshot and keeps the previous result. Browser snapshot remains fallback; assumption edits stay local until a rerun.
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
