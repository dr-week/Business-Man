# Product and market brief

## Positioning

Businessman should focus on **evidence-backed go/no-go decisions for Indian founders and small advisory teams**. Its useful distinction is the chain from research source → claim → supporting or disconfirming check → buyer/pilot evidence → recorded product revenue → next action. This is visible in `research_runs`, `research_checks`, `hunt_leads`, `product_revenue`, and the owner-scoped validation report. Do not position it as a generic analytics dashboard or claim market demand from research volume alone.

| Product | Strong at | Gap Businessman can target |
| --- | --- | --- |
| [Metabase](https://www.metabase.com/docs/latest/dashboards/subscriptions) | BI dashboards, sharing, scheduled email/Slack delivery | Does not make buyer interviews, falsification checks, and payment proof the main decision workflow |
| [Dovetail](https://dovetail.com/pricing/) | Customer-research repository, AI analysis, team collaboration | Focuses on customer feedback; no built-in path from opportunity claim to paid-pilot/revenue validation |
| [LivePlan](https://www.liveplan.com/pricing) | Sourced market research, idea validation, forecasts, readiness review, and ongoing plan tracking | Position against its planning suite by making buyer evidence and decision follow-through the core workflow; validate the gap with users |
| [IdeaBuddy](https://ideabuddy.com/pricing/) | Canvas, guided idea workflow, financial plan, validation, collaborators, and white-label plans | Its staged planning experience sets a strong UX baseline; keep the evidence trail tied to the next real-world buyer test |

Metabase has scheduled dashboard delivery; custom filters are plan-gated. Dovetail offers a free individual tier and custom-priced Enterprise. This confirms paid precedent for reporting, collaboration, and automation, not willingness to pay for Businessman specifically.

For decision UX, LivePlan combines sourced market reports with financial readiness; IdeaBuddy combines an idea canvas, validation flow, and collaborator sharing. LivePlan lists Standard at $20/month or $15/month billed annually and Premium at $40/month or $30/month billed annually. IdeaBuddy lists a free tier and 15-day trial; white-label and enterprise plans use custom quotes. These prices are competitor signals, not willingness-to-pay evidence for Businessman or Indian pricing. BUSINESSman should differentiate through traceable buyer checks and paid-pilot evidence, without claiming those products lack validation. The triage badge keeps verdict label, icon, and tone in one shared UI config; the evidence panel remains explanatory without repeating the badge.

## Buyer and demand hypothesis

- **First users:** solo founders, startup advisors, incubators, and boutique research consultants who must show why a business idea is worth testing.
- **Likely payer:** consultant or small team delivering repeated market-validation work; later, incubators managing multiple founder cohorts. A casual idea explorer is likely free-tier.
- **Why pay:** save analyst time and produce an auditable client/funder brief with evidence quality, buyer responses, and captured sales separated from assumptions.
- **India fit:** viable to test with INR reporting and India-specific sources/payments. ONDC/MSME digitization activity indicates more merchants use digital channels, but is not evidence that they need this product. Validate with 10 interviews and 5 paid pilots before forecasting revenue.
- **Where to sell:** self-serve site and founder communities first; partner with incubators and market-research/SME consultants for repeat use. Sell outcomes (validated niche, documented buyer evidence, decision brief), not “AI analytics.”

## Revenue path

1. Free self-hosted core for discovery and evidence logging.
2. Paid hosted workspace for collaboration, recurring source collection, shareable client reports, and scheduled delivery.
3. Higher-priced onboarding, custom data connectors, private deployment, and support for incubators/advisors.

Treat tiers and pricing as experiments. Ask interviewees to pay for a narrow pilot; do not infer demand from sign-ups or compliments. The existing signed Razorpay webhook provides a path to distinguish captured product sales from owner-entered buyer claims.

## Open-source and ownership

The repository now uses **AGPL-3.0-only**. It requires modified network-served versions to offer source to their users, but it does **not** stop copying, forks, or compliant competing services. Monetize hosted convenience, collaboration, data connectors, support, and brand trust; the license does not reserve revenue for one owner. Preserve authorship records. Before promising a separate commercial license for outside contributions, obtain contributor terms that grant those rights. Protect the product name separately with trademark rights. India’s Copyright Office treats computer programs as copyrightable works; copyright protects code, not the business idea. Have an India-qualified lawyer review the license, contributor terms, and commercial offer.

## Reporting workflow change

The validation report now has an explicit refresh control. It avoids background polling, keeps the last good snapshot visible during refresh, and labels stale data if a refresh fails. Do not enable recurring email until recipients opt in and a real scheduler, data source, and delivery settings exist; the legacy email worker points at a separate SQLite file and is not scheduled.

Metabase offers scheduled email/Slack dashboards with CSV, XLSX, and PDF attachments; custom subscription filters are paid-plan gated. Its published USD pricing includes a free self-hosted edition, Starter from $100/month plus seats, Pro from $575/month plus seats, and Enterprise from $20,000/year. BUSINESSman currently refreshes and shares an owner-scoped Markdown brief; scheduled delivery remains explicitly unimplemented and is tracked in issue #25. The useful wedge is a brief tied to buyer evidence and payment signals, while reports still need an opt-in scheduler before matching the delivery workflow.

## Sources

- [Metabase subscriptions](https://www.metabase.com/docs/latest/dashboards/subscriptions) and [plan comparison](https://www.metabase.com/pricing/compare-plans)
- [Metabase pricing](https://www.metabase.com/pricing)
- [Dovetail pricing and tiers](https://dovetail.com/pricing/)
- [LivePlan pricing](https://www.liveplan.com/pricing) and [sourced market research workflow](https://help.liveplan.com/liveplan-s-market-research-feature)
- [IdeaBuddy pricing and collaboration plans](https://ideabuddy.com/pricing/)
- [MSME/ONDC digital-channel activity, Government of India](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2236872&lang=1&reg=20)
- [GNU AGPL overview](https://www.gnu.org/licenses/) and [AGPL FAQ](https://www.gnu.org/licenses/gpl-faq.en.html)
- [Copyright Office of India: software copyright FAQ](https://copyright.gov.in/frmFAQ.aspx/Copyright_Act_1957/Images/ScriptLibrary/FORMXV/Images/Documents/images/JQuery/Society/Applicant/Images/JQuery/HyperlinkPolicy.aspx)
