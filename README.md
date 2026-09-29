# Businessman

Evidence-led discovery and assessment of specific business opportunities. It helps users collect signals, compare alternatives, estimate economics from explicit inputs, and plan a buyer test. It does not promise success or treat search activity as sales.

## Research workflow

`Discover → verify → compare → model → test → record outcome`

- Keep source, date, geography, and evidence type attached to claims.
- Keep unknown values unknown. Financial outputs are scenarios from stated assumptions, not forecasts of actual sales.
- Separate features and detail panels; keep secondary analysis collapsed until needed.

## Modules

| Feature | Entry point |
|---|---|
| Discovery and analysis | `components/source-discovery.tsx`, `lib/research-engine.ts` |
| Provider adapters | `lib/collectors/` |
| Evidence and source lineage | `lib/claim-extraction.ts`, `lib/evidence-lineage.ts` |
| Economics and risks | `lib/economics.ts`, `lib/investment-risks.ts` |
| News and opportunity feeds | `lib/news/`, `components/news-feed.tsx` |
| APIs and persistence | `app/api/`, `db/schema.ts`, `drizzle/` |
| Feature UI | `components/research/`, `app/hunt/hunt.scss` |

## Stack

TypeScript, React 19, Next App Router via vinext/Vite, Cloudflare Workers, D1/SQLite, Drizzle, Zod, Vitest. Reuse installed Base UI/shadcn primitives, Lucide icons, and Recharts. Do not add a second UI stack for one component.

## Local setup

Requires Node.js `>=22.13.0` and npm.

```powershell
npm install
npm run db:local:apply
npm run dev
```

Optional research providers and server-only credentials: [Integration guide](docs/INTEGRATION.md). Local provider calls may be unavailable without credentials.

## Checks

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Contributing

Read [contribution rules](docs/CONTRIBUTION.md) before changing a module. Start with [developer docs](docs/README.md); the [market review](docs/MARKET_RESEARCH_REVIEW.md) tracks competing products, source/API limits, and OSS candidates.
