# Market Research API

## Overview
The endpoint `GET /api/market-research` returns a JSON snapshot of key Indian business‑analytics market metrics. It currently pulls:
- **GDP (current US$)** – overall market size potential.
- **Internet penetration (%)** – proxy for SaaS adoption.
- **Startup counts** – total startups and those focused on analytics.

## Response Example
```json
{
  "market": "India Business-Analytics (Open-Source)",
  "metrics": {
    "gdpCurrentUS$": 3170000000000,
    "internetPenetrationPct": 47.4,
    "startupCount": 12457,
    "analyticsStartups": 842
  },
  "generatedAt": "2026-09-30T17:12:00.000Z"
}
```

## Usage
```ts
import useSWR from 'swr';
const { data, error } = useSWR('/api/market-research');
```

## Future Enhancements
- Add more granular metrics (industry‑specific revenue, regional adoption).
- Cache results in Cloudflare KV for 12 h to reduce external API calls.
- Provide a GraphQL wrapper for selective field fetching.
