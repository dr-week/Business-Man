# Backend

| Path | Responsibility |
|---|---|
| `app/api/hunt/research/route.ts` | Research orchestration/cache |
| `lib/research-engine.ts` | Input schema, grouping, scoring |
| `lib/economics.ts` | Scenario calculations |
| `app/api/hunt/leads/` | Authenticated owner-scoped dossiers/evidence |
| `db/schema.ts`, `drizzle/` | D1 schema/migrations |
| `app/api/news/route.ts` | Independent RSS endpoint |

## Research

Submit -> prepare query -> fetch -> group evidence -> compare.

- Ask HN + Stack Overflow: 20 results each; 12s/provider; 1 MB/provider; 10-minute cache.
- Optional supplied webpages: [collector](../services/collector/README.md).
- Latest research: browser storage. Owner-scoped legacy dossiers: D1, `/hunt/legacy`.
- Preserve URL, provider, dates, excerpt, and claim provenance. Discussion activity never proves sales.
- Unknown stays missing. Separate sourced values, estimates, and hypotheses.

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
