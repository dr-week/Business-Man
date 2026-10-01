const products = [
  {
    name: "DimeADozen",
    focus: "One-time idea validation report",
    offer: "Sourced market, competitor, risk, and unit-economics analysis delivered as a decision report.",
    price: "$9 Starter; $129 full report; one-time",
    boundary: "Pre-build validation report; its pricing page says it is not a lender-ready business plan. Public examples emphasize English-speaking US, UK, and AU markets.",
    url: "https://www.dimeadozen.ai/pricing",
  },
  {
    name: "IdeaBuddy",
    focus: "Business planning workspace",
    offer: "Canvas, step-by-step guide, financial plan, validation, collaborators, and exports.",
    price: "Free entry; paid plans; incubator and enterprise plans by quote",
    boundary: "Planning workspace built from your inputs; its public feature page does not position it as a live company-intelligence feed.",
    url: "https://ideabuddy.com/pricing",
  },
  {
    name: "Moshpit",
    focus: "Founder-approved market experiments",
    offer: "Research, experiment drafts, launch assets, spend-cap monitoring, and evidence memos. Founder approves tests and controls external accounts.",
    price: "$99/month; external ad and tool costs excluded",
    boundary: "Founder chooses the experiment, spend cap, and verdict; external ad, domain, and payment costs stay separate.",
    url: "https://www.moshpit.in/pricing",
  },
  {
    name: "Crunchbase Pro",
    focus: "Company intelligence and prospecting",
    offer: "Private-company search, funding and firmographic data, saved searches, alerts, and AI assistant.",
    price: "7-day trial; checkout displays per-seat subscription pricing",
    boundary: "Private-company intelligence and alerts; its public offer does not center local small-business validation or unit-economics planning.",
    url: "https://www.crunchbase.com/buy/cb-pro",
  },
];

export function MarketSoftwareComparison() {
  return <section className="research-detail-card market-software-comparison" aria-labelledby="market-software-heading">
    <h3 id="market-software-heading">Competitor comparison</h3>
    <p>Adjacent tools sell a report, a planning workspace, experiments, or company data. Pricing is a market signal, not proof of demand for BUSINESSman.</p>
    <p className="market-software-hypothesis"><strong>Positioning to validate:</strong> one location-specific shortlist that links buyer and competitor evidence to transparent financial scenarios. Ask founders and advisors whether this combined decision brief is worth paying for.</p>
    <details>
      <summary>Compare 4 products, features, and published pricing</summary>
      <div className="market-software-list">
        {products.map((product) => <article key={product.name}>
          <h4>{product.name}</h4>
          <p><strong>{product.focus}</strong></p>
          <p>{product.offer}</p>
          <p><strong>Published price:</strong> {product.price}</p>
          <p className="market-software-boundary"><strong>Scope boundary:</strong> {product.boundary}</p>
          <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${product.name} official pricing`}>Official pricing ↗</a>
        </article>)}
      </div>
      <small>Official pages checked 1 Oct 2026. Prices and plan terms can change; recheck before purchase.</small>
    </details>
  </section>;
}
