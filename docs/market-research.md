# India market context

`GET /api/market-research` fetches India’s latest available GDP and internet-use observations from the World Bank Indicators API. It requests a ten-year window and selects the latest non-null value. Each value includes its indicator, observation year, and source URL. Requests time out after eight seconds; successful responses can be cached for six hours.

These national indicators are context only. They do not measure analytics-product demand, addressable customers, willingness to pay, or revenue. Use founder interviews and paid pilots for those questions.

The API requires no key. See the [World Bank API guide](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392).

## Product gap to test

- [Tracxn](https://tracxn.com/pricing) sells curated company/funding discovery, team research, reports, and API/data packs; Lite is limited and commercial pricing is sales-led.
- [Dovetail](https://dovetail.com/pricing/) organizes a team’s own calls, documents, and surveys, with a free individual plan and custom Enterprise pricing.
- BUSINESSman can test a narrower job: connect a proposed Indian business to dated local signals, counter-evidence, buyer checks, and break-even assumptions. Macro indicators, company counts, listings, and research scores do not prove demand; founders and advisors still need to pay for a brief or pilot before we claim fit.
