const alternatives = [
  {
    name: "DimeADozen",
    buyer: "Founder screening an idea",
    offer: "Source-linked validation report; one-time purchase",
    price: "$9 starter · $129 full report",
    url: "https://www.dimeadozen.ai/pricing",
    label: "Published price",
  },
  {
    name: "IdeaBuddy",
    buyer: "Founder planning with collaborators",
    offer: "Guided idea development, financial plan, validation, and sharing",
    price: "Free tier/trial; paid plans",
    url: "https://ideabuddy.com/pricing",
    label: "Plan features",
  },
  {
    name: "Moshpit",
    buyer: "Founder running pre-build demand tests",
    offer: "Research, approved experiments, spend caps, and test monitoring",
    price: "$99/month",
    url: "https://www.moshpit.in/pricing",
    label: "Published plan",
  },
] as const;

export function MarketPositioning() {
  return <details className="revenue-sensitivity-module market-positioning">
    <summary>Competitor offers and our testable difference</summary>
    <div className="market-positioning-content">
      <p className="revenue-math-note">Public product pages show an existing category and price anchors. They do not prove customer counts, conversion, or willingness to pay for BUSINESSman.</p>
      <div className="market-comparison-table-wrap">
        <table className="market-comparison-table">
          <thead><tr><th>Product</th><th>Buyer / job</th><th>Published offer</th><th>Price signal</th></tr></thead>
          <tbody>{alternatives.map((item) => <tr key={item.name}>
            <th scope="row"><a href={item.url} target="_blank" rel="noreferrer">{item.name}</a></th>
            <td>{item.buyer}</td><td>{item.offer}</td><td>{item.price}<small>{item.label}</small></td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="revenue-math-note"><strong>BUSINESSman positioning to test:</strong> connect source-backed market findings to explicit financial assumptions and a buyer-validation action; track paid pilots separately from reported interest. That is a product hypothesis, not a proven advantage. Interview founders and incubator/advisor buyers, then measure completed paid pilots, delivery cost, refunds, and repeat use.</p>
      <small className="market-comparison-date">Public pages checked 1 October 2026. Competitor descriptions and prices can change.</small>
    </div>
  </details>;
}
