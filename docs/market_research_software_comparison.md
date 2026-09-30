# Market Research Software Comparison (GitHub)

## Overview
We examined several open‑source tools that provide market‑research‑oriented analytics. The goal was to discover what they **offer**, what they **miss**, which parts can be **automated**, and how they **monetize**.

| Project | Core Features | UX Strengths | Missing Features | Automation / Extensibility | License | Pricing / Premium Add‑ons |
|---------|---------------|--------------|------------------|----------------------------|---------|---------------------------|
| **PostHog** | Event tracking, funnel analysis, heatmaps, feature flags. | Modern React UI, loading skeletons, dark mode support. | No built‑in market‑size estimation, no competitor‑analysis module. | Plugins (ingest from Kafka, S3) and **Webhooks** for automation. | MIT | Free core; Enterprise tier $2 k /mo (includes advanced UI & SSO). |
| **Plausible Analytics** | Page‑view stats, simple goal tracking, GDPR‑first. | Minimal UI, fast page loads, clear charts. | Lacks multi‑dimensional segmentation, no export of raw data. | API for event ingestion; can be scripted for automated reporting. | GPL‑3.0 | Free; €9 /mo for premium dashboards. |
| **Apache Superset** | SQL‑based BI, drag‑and‑drop visualisation builder, extensive chart library. | Rich UI widgets, theming, authentication plugins. | Heavy bundle, steep learning curve → high RAM usage, not lightweight for SMEs. | SQL‑Alchemy connectors, REST API for dashboard generation. | Apache‑2.0 | Free (self‑host). |
| **OpenBB** *(finance‑focused)* | Notebook‑style research, data‑source adapters, valuation models. | Jupyter‑like UI, interactive widgets, export to CSV/Excel. | Not generic market‑research; finance‑specific terminology. | Python SDK, pluggable data providers. | MIT | Free core; optional paid data‑feeds (e.g., Bloomberg). |
| **Our LAYA System‑1 + Market‑Research UI** | Fast heuristic evaluation, lazy‑loaded decision engine, premium PDF/CSV export, modular bounties workflow. | **Skeleton loading**, error placeholders, responsive charts (new `ReportingDashboard`). | Still missing a visual **data‑source selector** and **real‑time collaboration** pane. | Decision‑engine can be called via API; **decisionCache** added to reduce recomputation. | MIT (core) + JWT‑guarded premium. | Premium PDF/CSV export ₹1 499 /mo; enterprise license negotiable. |

## Key Take‑aways for Our Product
1. **Skeleton loading & error guards** are proven UX patterns – we already implemented them in `ReportingDashboard`.  
2. **Export options** (PDF & CSV) are a common premium hook – we added CSV export (see `marketExportCsv.ts`).
3. **Low‑RAM cache** helps with high‑throughput decision calls – `decisionCache.ts` implements an LRU cache.
4. **Collaboration UI** is missing in many OSS tools; we can expose a simple shared‑bounty view (future work).

## Recommended Scoped Improvement
**Add CSV export for market‑research bounties (premium‑only).**
- Mirrors existing PDF export, giving users a choice of format.
- Low implementation effort, high perceived value.
- Validated via unit tests (test‑driven validation method).
