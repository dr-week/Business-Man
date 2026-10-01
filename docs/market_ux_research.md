# Market and revenue brief

Checked 30 September 2026. Market fit and pricing below are hypotheses; no customer interviews, paid pilots, or product conversion data are recorded in this repository.

## Market and alternatives

There is a market for adjacent jobs, not yet proof of demand for BUSINESSman specifically:

| Alternative | What it does well | Gap BUSINESSman could test |
| --- | --- | --- |
| [Crunchbase Pro](https://www.crunchbase.com/buy/cb-pro) | Company/funding data, saved searches, alerts, AI-assisted company research; page showed US$49–79 per seat/month with annual billing when checked. | More company intelligence than early idea validation or local buyer verification. |
| [Dovetail](https://dovetail.com/pricing/) | Customer interview and feedback repository, AI analysis, collaboration; free individual plan, enterprise pricing by sales contact. | Starts with a team's own customer data, not broad opportunity discovery and buyer/supplier evidence. |
| [Open Product Researcher](https://github.com/lhstorm/open-product-researcher) | Open-source research agent; generates traceable, stepwise research files. | Its public description does not establish local paid-demand validation or an India-specific workflow. |

BUSINESSman’s defensible product direction is a short, auditable decision workflow: query → dated evidence and counter-evidence → named buyer and price gap → assumptions/break-even → next validation action. The code already separates research, economics, evidence, and validation. Evidence lineage, transparent unknowns, and Indian source coverage are the strongest differentiators to test. Source count, forum activity, model scores, and market-size estimates are not purchase evidence.

For investment-analysis pricing, RaiseIQ lists focused India founder reports for unit economics and cash/runway at ₹1,999 each, says buyers pay online and receive reports in the same session, and offers a free snapshot. This supports testing a focused paid brief and free preview. It is an advertised offer, not verified transaction volume; do not copy its price without testing. [RaiseIQ report menu](https://raiseiq.in/reports/)

## Users, payer, and route to market

- **First user:** founder deciding whether to invest time or capital in an idea. Likely payer: that founder, for an evidence-linked report or guided validation sprint.
- **Repeat payer:** startup advisor, incubator, consultant, or venture studio screening several ideas. Likely payer: the organization, for a shared workspace, reusable reports, collaboration, and export.
- **Later segment:** investors and market-entry teams; they need stronger coverage, freshness, and demonstrated decision quality first.
- **India:** viable to test with INR pricing, local geography and sources, mobile-friendly pages, GST-ready billing, and low-cost entry. India's official MSME dashboard reported 9.67 crore combined Udyam/UAP registrations on 12 June 2026; that count is context, not a count of likely buyers for this product ([dashboard](https://dashboard.msme.gov.in/?form=mg0av3)). Start with founders/advisors/accelerators, not all MSMEs.
- **Routes:** self-serve website for one-off reports; advisor/accelerator pilots for repeat use; founder communities and search content for discovery. These channels are untested. Do not claim traction from forum posts or registrations.

Forum evidence is directional only. An Ask HN thread describes an open-source product that gained requests and donations, then made requested advanced features paid; replies also warn that using a product does not imply willingness to pay. The practical test is a paid offer, not a popularity score ([thread](https://news.ycombinator.com/item?id=29691811)).

## Revenue experiment

Start with one paid, founder-facing deliverable before building a broad collaboration network:

1. Offer a fixed-scope opportunity brief with sources, counter-evidence, named buyer, competing workaround, and one validation plan.
2. Recruit 10 target founders/advisors through opted-in communities and 3 incubator/advisor prospects. Ask for a paid pilot or deposit; record price offered, purchase, delivery hours, refund, and repeat request.
3. Test a second offer only if buyers return: a small team workspace for advisor cohorts. Keep services separate in the ledger from recurring software revenue.

Suggested initial price test: ₹999 for a founder brief and ₹9,999 for a facilitated pilot. These are experiment prices, not researched market rates. Do not forecast revenue until payment and delivery-cost data exist. Collaboration should mean shared evidence, comments, assigned validation tasks, and a change history—not an unmoderated idea forum. Charge for hosted convenience, repeated workflows, collaboration, fresh/verified research, and human validation; do not charge for a claim that an automated report is guaranteed correct.

## Licensing and copying

This checkout has no root `LICENSE`, so it is not currently licensed as open source. GitHub states that absent a license, default copyright applies and others have no general permission to reproduce, distribute, or make derivatives; public GitHub users can still view and fork under GitHub's site terms ([GitHub licensing guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)).

The hosted export gate now verifies an expiring, signed premium token and fails closed without a strong `LICENSE_SECRET`. It has no checkout, token-issuing, revocation, or customer-entitlement workflow; it is not a software license or a sellable paid plan.

Decide ownership and inspect dependency licenses before publishing. If the goal is open source with network-use reciprocity, evaluate AGPL-3.0: modified hosted versions must offer their corresponding source to remote users. It permits commercial use and does not stop a compliant fork or guarantee revenue ([GNU AGPL](https://www.gnu.org/licenses/agpl-3.0.html), [GNU FAQ](https://www.gnu.org/licenses/gpl-faq.en.html)). A permissive license makes reuse easier but also easier to repackage. Dual licensing or proprietary add-ons require rights to every included contribution; do not promise this before contributor terms and copyright ownership are settled. Sell service and evidence quality, not exclusivity over published code.

## UI/UX and next decision

Keep the first screen focused on one question, geography, and budget. Put source date, link, evidence type, and uncertainty beside each claim; distinguish comments/answers from buyer intent; keep assumptions editable; show the next evidence-gathering action. Progressive disclosure keeps economics, competitors, sources, and collaboration separate until needed. On mobile, keep citations and the primary action reachable without hiding uncertainty.

The local-listing check now requires an explicit click because Google Places is pay-as-you-go and field masks can change the billed SKU. The U.S. Census connector does not cover India; the Udyam state dashboard is a manual reference, not an app-fed count. Label registrations as business presence, not customer demand. [Places billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)

Next validation gate: 10 founder interviews, 3 advisor/accelerator interviews, and at least 3 paid briefs before prioritizing team collaboration or a subscription. Record objections and non-purchases too. If users want a free report but will not pay for a validated next action, change the offer before adding features.

## Reporting workflow

Metabase offers configurable dashboards, filters, exports, and scheduled subscriptions; it monetizes hosted service, support, and commercial features while keeping a self-hosted AGPL edition ([plan comparison](https://www.metabase.com/pricing/compare-plans), [license terms](https://www.metabase.com/license)). BUSINESSman’s narrower report summarizes owner-scoped saved research, falsification checks, and buyer/payment signals. Opportunity payments remain user-reported; captured BUSINESSman receipts are tracked separately after signed payment webhooks. Treat both as workspace records, not market-wide demand proof. The live report is `/hunt` → Validation report; avoid synthetic score charts.

## Source locality

Forum posts can describe a problem without proving demand in the requested place. The budget/location factor now reads `source.locality.place` and its `basis`; web collectors may submit `source-stated`, while a top score requires separately verified local buyer or official evidence. Missing locality stays unknown. This prevents false matches such as “goals” in a [real Ask HN post](https://news.ycombinator.com/item?id=13855577) being counted as evidence for Goa. Indian founders also report difficulty collecting local city data ([discussion](https://www.reddit.com/r/indianstartups/comments/1u0zsyq/building_a_local_city_platform_in_india_stuck_on/)); that is a research need, not proof they will pay for BUSINESSman.
