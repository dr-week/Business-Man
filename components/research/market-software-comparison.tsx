const products = [
  {
    name: "Tracxn",
    focus: "Startup and private-company intelligence",
    offer: "Company, funding, investor, deal-flow, and screening data",
    workflow: "Automates deal scouting; gated Lite access supports product-led discovery",
    price: "Free Lite with limits; paid plans and data packs are sales-led",
    url: "https://tracxn.com/pricing",
    source: "Official pricing",
  },
  {
    name: "Crunchbase Pro",
    focus: "Company discovery and prospecting",
    offer: "Private-company search, funding and firmographic profiles, saved lists, alerts, exports",
    workflow: "Saved dynamic searches and automatic alerts; free trial leads into a per-seat plan",
    price: "$79 per seat/month billed annually; $99 month-to-month",
    url: "https://www.crunchbase.com/buy/cb-pro",
    source: "Official product and checkout",
  },
  {
    name: "Dovetail",
    focus: "Customer research and feedback analysis",
    offer: "Organizes calls, documents, and surveys; AI summaries and team-scale research workflows",
    workflow: "AI agents track customer signals; comments, integrations, and shared projects support teams",
    price: "Free individual plan; Enterprise custom pricing",
    url: "https://dovetail.com/pricing/",
    source: "Official pricing",
  },
  {
    name: "RaiseIQ",
    focus: "India founder readiness and financial analysis",
    offer: "Focused unit-economics and cash/runway reports; free snapshot and same-session online delivery",
    workflow: "One paid report answers one defined question",
    price: "₹1,999 each for unit economics or cash/runway; other focused reports ₹999–₹4,499",
    url: "https://raiseiq.in/reports/",
    source: "Official report menu",
  },
];

export function MarketSoftwareComparison() {
  return <section className="research-detail-card market-software-comparison" aria-labelledby="market-software-heading">
    <h3 id="market-software-heading">How research tools differ</h3>
    <p>These products serve adjacent jobs: company intelligence, prospecting, or customer-feedback research.</p>
    <div className="market-software-list">
      {products.map((product) => <article key={product.name}>
        <h4>{product.name}</h4>
        <p><strong>{product.focus}</strong></p>
        <p>{product.offer}</p>
        <p><strong>Workflow / automation:</strong> {product.workflow}</p>
        <p><strong>Public pricing:</strong> {product.price}</p>
        <a href={product.url} target="_blank" rel="noopener noreferrer">{product.source} ↗</a>
      </article>)}
    </div>
    <p className="market-software-hypothesis"><strong>Businessman hypothesis to test:</strong> bring source-backed market signals, counter-evidence, buyer checks, and editable economics into one decision brief. These competitors’ public offers show paid categories, not proof that buyers will pay us.</p>
    <small>Pricing pages checked 1 Oct 2026; confirm terms before purchase.</small>
  </section>;
}
