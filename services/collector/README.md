# Collector

Optional Python service: `server.py` -> `providers/` -> `extractors/`; app adapter: `lib/collectors/web.ts`.

## Setup

```powershell
python -m venv services/collector/.venv
services/collector/.venv/Scripts/python.exe -m pip install -r services/collector/requirements.txt
npm run collector
```

Python 3.10+; Unix uses `.venv/bin/python`. Launcher writes ignored `.dev.vars`; restart website afterward. Supply up to three HTTPS URLs in Settings. Ctrl+C stops service.

## Contract

Authenticated `POST /collect`, body `{ "urls": ["https://..."] }`.
Results: `ok | blocked | unsupported | failed`; excerpts, tables, advertised offers, provenance. Advertised prices are not verified economics.

## Limits

- Scrapling 0.4.15; upstream dependency, no fork.
- One batch, two workers, three URLs; 8s/fetch, 1 MB/page; app timeout 35s.
- Public HTTPS:443; pinned public DNS; robots checks; no redirects.
- Challenges report blocked. No browser rendering, recursive crawl, or social-network discovery.
- Loopback development server; production needs private hosting and HTTPS `COLLECTOR_URL` plus secret `COLLECTOR_KEY`.
- Transport: uses supported `Fetcher.get` parameters with 1 MB response limit enforcement.
