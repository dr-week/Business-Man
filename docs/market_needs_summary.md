# Market Needs & Revenue Summary

## Target Users
- **SMEs & Start‑ups in India** building B2B SaaS products that need fast go‑to‑market validation.
- **Product managers** looking for data‑driven competitor & market gap analysis.
- **Investors / incubators** that require a quick‑snapshot of market opportunity and risk.

## Why They’ll Use It
- **Speed:** LAYA/System‑1 decision heuristics give a **sub‑second verdict** on the viability of a research opportunity.
- **Self‑hosting:** Potential delivery model; do not advertise it as open source until a repository license is chosen.
- **Revenue hypotheses:** Exports, fresh research, and team workflows need buyer validation; the software license is undecided.

## Where to Sell
- **Self‑serve SaaS portal** (hosted on Vercel/Firebase) targeting Indian entrepreneurs.
- **Marketplace listings** on open‑source platforms (GitHub Marketplace, npm) for the premium plugins.
- **Hosted export access:** Experimental JWT route checks exist; they are not a license server or entitlement-management service.

## Revenue Model
| Stream | Description | Pricing (suggested) |
|--------|-------------|---------------------|
| **Premium SaaS** | Access to PDF export, competitor‑scorer, API quota. | ₹1,499 / month per seat |
| **Enterprise License** | Unlimited seats, on‑prem deployment, SLA. | Negotiated (₹5 LPA + support) |
| **Consulting / Custom Bounties** | Paid research bounties using the existing `hunt/bounties` API. | Per‑project pricing |
| **Marketplace Extensions** | Paid npm packages for extra heuristics. | $29‑$99 one‑time |

## Licensing status
- No root `LICENSE` exists; the core is not declared MIT or otherwise open source.
- JWT route checks gate selected endpoints in the current host. They do not grant software rights or prevent source modification.
- Review ownership, contributor rights, and third-party notices before choosing a repository license. See [licensing status](LICENSING.md).

## Differentiators
- **Fast System‑1 heuristics** (our unique LAYA engine) for instant go/no‑go decisions.
- **Indian‑market tuned rules** (regulatory, buyer‑persona, payback periods).
- **Modular architecture** – easy to plug‑in new data sources or decision models.
- **Privacy‑first analytics** – no third‑party tracking, compliant with Indian data laws.
