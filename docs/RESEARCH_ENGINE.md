# Research engine

## Pipeline

`POST /api/hunt/research` validates topic, geography, capital and filters; runs bounded providers; groups duplicate sources; extracts claims; estimates economics; ranks only when required factors have evidence. Provider output is not proof of paid demand. A completed run is archived to D1 with owner, original inputs, query interpretation, results, errors and timestamp. Keep 20 snapshots per owner; `GET /api/hunt/research-runs` loads the latest.

Use **Saved research → Download backup** for a portable JSON snapshot. **Import backup** validates format v1 and the research input, assigns a new archive ID to the signed-in owner, and applies the same 20-run retention limit. Upload limit: 1.9 MB.

`lib/economics.ts` reports arithmetic break-even thresholds for price, variable cost, fixed cost, and units. The Economics view keeps them collapsed and labels them as targets, not forecasts. Users must verify inputs with dated buyer and supplier evidence.

`lib/source-grouping.ts` deduplicates canonical HTTP(S) URLs (tracking parameters, query order, fragment, and `www` ignored) and merges similar titles. Invalid or credentialed URLs retain records by provider/id rather than colliding. Source caps bound CPU and memory; grouping is heuristic, not proof two reports share an origin.

Evidence independence uses normalized full text when available and canonical URLs for short records. URL fragments, `www`, and common tracking parameters do not create additional sources. Similar but non-identical reports remain separate; this conservative rule avoids semantic false merges.

Each linked source lineage contributes at most one independent claim to a scoring factor, even when its text yields several claims. Multi-source claims count each distinct linked lineage once.

`db/schema.ts` owns the schema; append SQL migrations under `drizzle/` and apply with `npm run db:local:apply`. `lib/research-run-store.ts` batches save and 20-run owner-scoped retention; snapshots above 1.9 MB UTF-8 are rejected before D1 writes. Snapshots are immutable; edited assumptions remain browser-local until another run. `lib/bounded-cache.ts` holds owner-scoped results for 10 minutes, at most 8 entries and 1 MiB of estimated JSON size; oversized results bypass cache. The isolate gate admits 2 active and 6 waiting searches.

Counter-evidence checks are owner- and run-scoped. Re-submitting the same normalized question for the same opportunity returns the existing check, so network retries do not create another row; different questions remain separate.

## Memory bounds

Cloudflare Workers has a 128 MB per-isolate limit ([limits](https://developers.cloudflare.com/workers/platform/limits/)). Request/body caps: input 16 KiB; Ask HN and Stack Exchange 1 MB each; supplied page 200 KB; Brave 512 KB; Places 128 KB; GitHub 256 KB; Census 64 KB. Caps do not include parsed-object overhead.

Market tools, gaps, APIs, and open-source candidates: [market review](MARKET_RESEARCH_REVIEW.md).

Current API notes: [Google Trends API](https://developers.google.com/search/apis/trends) remains alpha/early-access; docs describe five years of consistently scaled, region/time-series data. Do not make integration depend on general availability. [Places Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search) requires an explicit field mask; request only needed fields to limit processing and billing. Search interest and place listings remain proxies, not purchase evidence.

## Decision and UI modules

- Modules: discovery/query (`lib/discovery.ts`, `lib/research-query.ts`); providers (`lib/collectors/`); source lineage and claim extraction (`lib/evidence-lineage.ts`, `lib/claim-extraction.ts`); economics and ranking (`lib/research-engine.ts`); D1 persistence (`db/`, `drizzle/`, `app/api/hunt/research-runs/`); focused UI (`components/research/`). Keep discovery, Analysis, Economics, Sources, and Settings in separate views; disclose secondary detail on demand.
- Curated portal links live in `lib/official-sources.ts`; they open external pages and are not collected, synced, or treated as live opportunity records.
- Laya’s repository describes typed fast choice/score classifiers. In this app, use the optional adapter only to suggest query/research focus. Never use its confidence as opportunity strength or investment probability. Validate on labeled examples before triage; keep rules fallback. [Laya repository](https://github.com/NandhaKishorM/laya).
- System 1/System 2 is a human review pattern only: capture a reversible first impression, then inspect evidence and uncertainty. Intuition can anchor subsequent analysis; do not treat this as a validated scoring model. [Nature Reviews Psychology](https://www.nature.com/articles/s44159-025-00466-6) · [dual-process review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11591345/).
- Reuse installed shadcn/Base UI, Lucide and Recharts. [shadcn/ui](https://github.com/shadcn-ui/ui) is MIT-licensed; retain notices for copied code. [Evidence](https://github.com/evidence-dev/evidence) is an MIT reporting-pattern reference but brings a separate Svelte stack; do not add it to this React app.
- Keep provider payloads bounded and transient unless persistence is required and permitted. First impressions are browser-local, validated, capped at 200 entries, and evict the oldest insertion to bound storage and memory.

## Provider integrations

| Provider | Use | Limit |
|---|---|---|
| Ask HN, Stack Exchange | User pain and workflow language | Posts do not prove paying demand. |
| Brave Search | Cross-check web claims | Search rank is not evidence quality. |
| GitHub | Open-source alternatives and activity | Stars/issues are not market share or buyer demand. |
| Google Places | Local competitor candidates | Incomplete coverage; ranking and reviews are not market size. |
| [US Census CBP](https://www.census.gov/data/datasets/2023/econ/cbp/2023-cbp.html) | US employer establishments; state counts by broad industry, ZIP counts for all industries (NAICS 00) | 2023 reference year; ZIP counts are not industry-specific or demand. |
| User URLs | Direct source extraction | Respect access limits; retain source URL/date. |

References: [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview), [Census developer APIs](https://www.census.gov/data/developers.html), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [Drizzle migrations](https://orm.drizzle.team/docs/migrations).
