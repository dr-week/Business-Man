# Integrations

| Path | Role |
|---|---|
| `lib/discovery.ts` | Ask HN / Stack Overflow |
| `lib/research-query.ts`, `lib/query-spelling.ts` | Query preparation |
| `lib/query-classifier.ts` | Optional Laya adapter |
| `lib/research-focus.ts`, `components/research/` | Research focus guidance and follow-up links |
| `lib/industry-classifier.ts` | Conservative source-based industry labels and filters |
| `lib/collectors/web.ts` | Validated Python service client |
| `lib/collectors/places.ts` | Optional Google Places local listing candidates |
| `lib/collectors/brave-search.ts` | Optional transient general-web discovery |
| `lib/collectors/census-market.ts` | Optional U.S. County Business Patterns footprint |
| `lib/collectors/github-alternatives.ts` | Public software-repository candidates |
| `services/collector/` | [Setup, contract, blocker](../services/collector/README.md) |
| `lib/news/feed.ts` | RSS parsing/cache |

## Queries

Validate -> conservative typo correction -> preserve constraints -> rule classification -> keywords -> fetch.

- Keep original text; Search original bypasses rewriting.
- Auto-correct known typos only; ambiguous suggestions need selection.
- Protect names, codes, non-Latin text and location terms conservatively.
- Extracted constraints are approximate; never override financial inputs.

### Optional Laya

`LAYA_URL`: server-controlled endpoint; `LAYA_API_KEY`: optional bearer secret.

HTTPS required except loopback. Unresolved intents only; 3s timeout, 16 KB response limit, rule fallback. Labels cannot change queries or financial facts. Remote Workers cannot reach laptop localhost.

It may suggest one reversible research focus (buyers, competitors, location, economics, franchise, broad research). The suggestion is provisional; it does not rank investments or discard evidence. The focus card links to Google Trends for a manual check; it does not call an API.

Keep inference external and optional; do not bundle the model into the app. The [System-One package](https://github.com/italoalmeida0/laya-system-one) reports a ~324 MB on-disk model and browser WASM around 40× slower than native. Those are upstream measurements, not this app's benchmarks. The adapter caps response bodies at 16 KB and falls back to rules; validate local accuracy and host memory before deployment.

### External market data

- Supplied-page results are validated per requested URL. Malformed or blocked rows report their own error; valid sibling pages remain usable. Top-level responses above 200 KB or three rows are rejected.

- Google Trends API is alpha/approval-gated; current UI opens a Trends exploration link only. Recognized `-maxxing` phrases compare `-maxxing`/`-maxing` spellings; relative search interest is a lead, not proof of demand or sales.
- Places API (New) supplies nearby listing candidates when `GOOGLE_PLACES_API_KEY` is configured. Billing, attribution, field-mask pricing, and storage policies apply. Listings need verification; they are not market size.
- Business Profile API manages locations the caller owns or is authorized to manage; it is not a general competitor lookup service.
- Google Ads Keyword Planning can provide location-scoped search metrics for eligible accounts; search volume remains a proxy, not willingness to pay.
- Census CBP footprint is fetched only with server-side `CENSUS_API_KEY`; current mapping is U.S. state and broad NAICS sector, using 2023 employer-establishment counts. It excludes nonemployers and is not demand.
- Market view calls `/api/hunt/market` for the selected opportunity only; leaving cancels the request. Places and Census candidates do not affect scores or the research-result cache.
- GitHub alternatives use repository search; stars, descriptions, and update dates are discovery signals, not proof of adoption or commercial equivalence.
- General web candidates are fetched only when `BRAVE_SEARCH_API_KEY` is configured server-side. Uses Brave Web Search REST API through native `fetch`, one bounded request per search, eight results max, strict HTTPS result URLs, and an 8s/512 KB response limit. Results stay in transient UI state; do not persist result contents unless the selected Brave plan grants storage rights. Snippets are leads to review, never buyer proof.

## News

Drawer -> `/api/news` -> `lib/news/feed.ts` -> BBC/Guardian Business RSS.

- Publisher headlines/descriptions; global coverage; no generated summaries.
- Two parallel fetches: 8s, 500 KB/feed; return newest 30, deduplicate URLs.
- Reject XML DTD/entities; publisher HTTPS links only; render text.
- Per-Worker cache: 10 minutes; shared in-flight request; stale fallback retries after 1 minute.
- Open/refresh only; no polling. Refresh respects cache.
- Partial failures identify publisher; unavailable first fetch returns 503.
- No model, database, or separate process. Check publisher reuse terms before public distribution.
- Headlines yield investigation leads with unknown costs. For You and Demand Now require separately sourced investment and buyer records; currently empty.

## INR pilot checkout

- Apply D1 migration `0007_product_revenue.sql` before enabling checkout.
- Store `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` as server secrets. Set `RAZORPAY_DECISION_BRIEF_PRICE_PAISE` and `RAZORPAY_ASSISTED_VALIDATION_PRICE_PAISE` as positive integer paise amounts.
- Authenticated owners create hosted one-time links at `POST /api/revenue/checkout`. Fulfill manually; no subscription, automated delivery, or refund sync.
- The Revenue screen lists the owner’s last 100 links. A verified `paid` sale can be marked `fulfilled` at `POST /api/revenue/sales`; fulfillment is an internal work record and sends no customer message.
- Configure Razorpay webhook URL `/api/webhooks/razorpay` for `payment_link.paid`, using the same webhook secret. Only signature-verified events matching saved sale id, link id, INR amount, and currency count as captured receipts. Captured totals are before fees/refunds.
