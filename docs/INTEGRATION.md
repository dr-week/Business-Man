# Integrations

| Path | Role |
|---|---|
| `lib/discovery.ts` | Ask HN / Stack Overflow |
| `lib/research-query.ts`, `lib/query-spelling.ts` | Query preparation |
| `lib/query-classifier.ts` | Optional Laya adapter |
| `lib/collectors/web.ts` | Validated Python service client |
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

Status: adapter only; model accuracy/latency/RAM unverified.

## News

Drawer -> `/api/news` -> `lib/news/feed.ts` -> BBC/Guardian Business RSS.

- Publisher headlines/descriptions; global coverage; no generated summaries.
- Two parallel fetches: 8s, 500 KB/feed; return newest 30, deduplicate URLs.
- Reject XML DTD/entities; publisher HTTPS links only; render text.
- Per-Worker cache: 10 minutes; shared in-flight request; stale fallback retries after 1 minute.
- Open/refresh only; no polling. Refresh respects cache.
- Partial failures identify publisher; unavailable first fetch returns 503.
- No model, database, or separate process. Check publisher reuse terms before public distribution.
