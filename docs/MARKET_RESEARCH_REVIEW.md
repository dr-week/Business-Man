# Market research product review

Reviewed 2026-09-29. Feature patterns inform modules; proprietary UI, content, and datasets are not copied.

## Benchmarks

| Product | Offers | Still requires local validation |
| --- | --- | --- |
| [Similarweb](https://www.similarweb.com/corp/web/market-intelligence/) | Digital market, competitor, audience, and geography signals | Offline demand, buyer commitments, startup costs, and unit economics |
| [Crunchbase Pro](https://about.crunchbase.com/products/crunchbase-pro) | Company/funding data, alerts, saved lists, and exports | Informal/local businesses, customer proof, and operating costs |
| [IBISWorld](https://help.ibisworld.com/en/articles/8149882-industry-reports) | Industry size, forecasts, risks, regulation, and financial benchmarks | Site-level feasibility and venture-specific sales |
| [FRANdata](https://frandata.com/about-us/) | Franchise research, FDD data, and benchmarks | Current verified profitability for a particular franchise unit |

Users: founders/operators, business-development teams, investors, franchise buyers, and analysts. Shared job: decide what to investigate, test, or fund. Search interest, listings, reports, and discussion are signals—not proof of sales.

## Current modules and gaps

Research, local market, economics, validation plan, evidence, risks, source library, alternatives, and user-reported validation outcomes are separate modules. Sources can be searched and filtered by buyer, official, supplier, discussion, or other; publication age flags undated and older-than-12-month material. The static opportunity workbench has no comparable economics, so it omits the former blank Numbers tab. Key gaps: broader verified data coverage, named competitor price freshness, non-U.S. local datasets, alerts, and measured outcomes. Keep unknowns visible; never turn source volume into investment odds.

## Reuse

- [shadcn/ui](https://github.com/shadcn-ui/ui) (MIT): accessible editable primitives; already represented in the installed component stack. Reuse before adding packages.
- [Rival](https://github.com/tessak22/rival) (MIT): competitor change history and evidence briefs; inspect its monitoring boundaries, not its product UI.
- [Tech Analyst](https://github.com/brightdata/tech-analyst) (MIT): company/pricing extraction patterns; examples depend on Bright Data and Gemini.
- [Tremor](https://github.com/tremorlabs/tremor) (Apache-2.0): dashboard patterns; Recharts is already installed.
- [Swipefile](https://github.com/gntrs/swipefile) (MIT): competitor ad capture and tagging; useful only for digital-ad research, not general local market evidence.
- [OpenBusiness](https://github.com/wanikua/OpenBusiness) (MIT): verified/inferred/missing claim labels, reproducible report artifacts, and assumption stress tests. Useful workflow patterns; its Python/LangGraph stack does not fit this TypeScript app.
- [GapScope](https://github.com/sarthak070707/gapscope-market-intelligence) (MIT): Next.js/TypeScript gap and saturation dashboard using launch scans, user feedback, and competitor comparisons. Recent, low-adoption repository with placeholder screenshots; inspect code and dependencies before adopting. Treat “blue ocean” scores as hypotheses, not market truth.

Check each dependency's license and notices before copying code. Prefer small SCSS modules and existing primitives.

## Data connectors

| Source | Use and limit |
| --- | --- |
| [Brave Search API](https://api-dashboard.search.brave.com/app/documentation/web-search) | Optional transient web leads; snippets are not persisted or scored. Follow plan-specific storage terms. |
| [Google Places](https://developers.google.com/maps/documentation/places/web-service/text-search) | Optional nearby listing candidates; requires key, billing, field mask, attribution, and policy-compliant storage. Not a complete market census. |
| [U.S. Census CBP](https://www.census.gov/data/developers/data-sets/cbp-zbp/cbp-api.html) | 2023 employer-establishment footprint by NAICS; U.S.-only and not demand. |
| [GitHub repository search](https://docs.github.com/en/rest/search/search#search-repositories) | Software alternatives and activity; misses offline/proprietary substitutes and commercial adoption. |
| [Google Ads Keyword Planning](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-historical-metrics) | Search volume and bid metrics for eligible accounts; volume is not willingness to pay. |
| [Google Trends API](https://developers.google.com/search/apis/trends) | Comparable regional/time-series interest; alpha access is gated and interest is not revenue. |
| [Google Custom Search JSON](https://developers.google.com/custom-search/v1/overview) | Closed to new customers; scheduled to discontinue 2027-01-01. Do not build on it. |

## LAYA System 1

[Repository](https://github.com/italoalmeida0/laya-system-one). Treat as an optional, reversible query/source triage experiment only. Current model metrics are task-specific and confidence is not calibrated for this product. Never use it to score investment success, alter financial inputs, or discard evidence. Compare against labeled local examples and rule-based fallback first.

The repository currently documents an ~88 MB package plus a separately acquired ~324 MB model. That model cannot fit inside Cloudflare Workers’ 128 MB per-isolate memory limit; keep inference behind the existing optional remote adapter or host it as a separate service. Do not load model weights in the research Worker.

## Next modules

1. Challenge/program listings now link from the source directory; results remain manual until a stable API is confirmed. Record host, problem, eligibility, deadline, incentive, and source date. A prize or pilot offer is not recurring buyer demand.
2. Add one official, dated data connector at a time; show geographic and freshness limits.
3. Monitor named competitors and prices with source dates and contradiction handling.
4. Record buyer tests and later outcomes; evaluate screening quality before ranking opportunities.

Primary references: [Startup India schemes](https://www.startupindia.gov.in/content/sih/en/government-schemes.html), [CPPP](https://eprocure.gov.in/eprocure/app?component=clear&page=FrontEndAdvancedSearch&service=direct), [OGD India](https://data.gov.in/). Treat portals as links until a documented API and dataset are identified.
