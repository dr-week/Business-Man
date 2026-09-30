# Market Research & Business Opportunity Summary

## Target Users & Industries
- **SMEs & startups in India** (product managers, founders, business analysts) seeking fast, data‑driven decision making.
- **Incubators / accelerators** that need to evaluate dozens of opportunities per month.
- **Consultancies & freelancers** who build pitch decks and investment memos.
- **Enterprise product teams** looking for a lightweight competitor‑analysis overlay.

## Why They Need It
| Need | Pain Point | How Our App Solves |
|------|------------|-------------------|
| Rapid opportunity scoring | Manual spreadsheets take hours | LAYA/System‑1 heuristics return a verdict in < 200 ms per opportunity.
| Consolidated competitor insights | Data scattered across SEO tools, public filings, and news feeds | Integrated collectors (web, API, CSV) feed directly into the decision engine.
| Low‑cost analytics | SaaS tools cost $100‑$200 per user per month | Open‑source core, pay‑only for premium add‑ons.
| Local compliance (India) | GDPR/Indian data‑privacy regulations | All processing can run on‑premise; only premium features require cloud endpoint with JWT guard.

## Competitive Landscape (2026)
| Tool | Core Offering | Pricing (USD) | Strengths | Gaps |
|------|---------------|---------------|----------|------|
| **Semrush** | SEO & market explorer | $129‑$140/mo | Rich keyword data, traffic estimates | No fast decision‑engine, heavy UI, not open source. |
| **Crayon / Klue** | Continuous competitive intelligence | $20k‑$40k/yr | Deep monitoring, battle‑cards, CRM integration | Very expensive, steep onboarding. |
| **Similarweb** | Traffic & industry trends | $199‑$299/mo | Broad market view, country‑level insights | Estimates only, limited customization. |
| **Competely** | AI‑generated competitor reports | $9‑$39/mo | Quick one‑click PDFs, easy UI | Limited data sources, no real‑time engine. |
| **Our App** | Real‑time opportunity scoring + competitor radar chart | **Free core**; premium add‑ons $15‑$50/mo per seat | Lightning‑fast heuristics, modular, open source, Indian‑ready | Still building UI polish, marketing automation, licensing guard. |

## Revenue Model & Licensing Strategy
1. **Core Open‑Source MIT License** – anyone can run the engine locally.
2. **Premium SaaS Add‑On (JWT‑protected)** – features:
   - Export to CSV/Excel with advanced filters.
   - Automated email reports (marketing automation worker).
   - Private API quota for large‑scale data ingestion.
   - UI premium components (e.g., radar chart, heat‑map dashboards).
3. **Enterprise License** – flat‑fee for on‑premise deployment with custom support and white‑labeling.
4. **Marketplace Extensions** – npm packages sold on our private registry (e.g., industry‑specific data connectors).
5. **Consulting / Custom Bounties** – optional paid services for bespoke heuristics.

### Pricing Sketch (per seat, USD)
| Tier | Monthly | Features |
|------|---------|----------|
| **Free** | $0 | Core engine, basic UI, community support. |
| **Pro** | $15 | CSV export, email automation, JWT‑guarded premium API. |
| **Enterprise** | $250+ | Unlimited seats, on‑premise deployment, SLA support, custom connectors. |

## IP Protection & Anti‑Theft Measures
- **JWT License Guard** – validates signed tokens before exposing premium endpoints.
- **Watermarking** – PDF/CSV exports embed a unique hash tied to the license key.
- **Private NPM Registry** – premium extensions are not publicly publishable.
- **Obfuscation** – optional build step to bundle the premium client bundle with code‑splitting.

## Market Viability in India
- **High demand for low‑cost analytics** – Indian SMBs spend ≤ $100/mo on SaaS; our free tier gets them in.
- **Local data residency** – on‑premise deployment satisfies Indian data‑locality regulations.
- **Rapid adoption of cloud‑native tooling** – growth of start‑up incubators (e.g., iCreate, T-Hub) creates a pipeline of early adopters.
- **Competitive gap** – no local open‑source solution offering sub‑second decision heuristics with UI visualizations.

## Next Steps (Implementation)
- **Finalize JWT license guard** (module `src/auth/licenseGuard.ts`).
- **Add water‑marking to CSV export** (`workers/csvExportWorker.ts`).
- **Integrate radar chart into reporting dashboard** (already added).
- **Create lean documentation** (`docs/lean_summary.md`).
- **Open actionable issues** (`docs/issues.md`).
- **Schedule marketing‑automation cron** to send weekly trial‑conversion emails.

> **Key Takeaway:** By offering a free, performant core and charging for premium, highly‑automated features, we capture both the cost‑conscious Indian SMB market and enterprise customers needing compliance‑ready, white‑label solutions.
