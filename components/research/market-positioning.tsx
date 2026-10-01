import { marketCompetitors } from "@/lib/market-competitors";

export function MarketPositioning() {
  return <details className="revenue-sensitivity-module market-positioning">
    <summary>Competitor offers and our testable difference</summary>
    <div className="market-positioning-content">
      <p className="revenue-math-note">Public product pages show an existing category and price anchors. They do not prove customer counts, conversion, or willingness to pay for BUSINESSman.</p>
      <div className="market-comparison-table-wrap">
        <table className="market-comparison-table">
          <thead><tr><th>Product</th><th>Buyer / job</th><th>Published offer</th><th>Price signal</th></tr></thead>
          <tbody>{marketCompetitors.slice(0, 3).map((item) => <tr key={item.name}>
            <th scope="row"><a href={item.url} target="_blank" rel="noreferrer">{item.name}</a></th>
            <td>{item.buyer}</td><td>{item.offer}</td><td>{item.price}<small>Published price</small></td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="revenue-math-note"><strong>BUSINESSman positioning to test:</strong> connect source-backed market findings to explicit financial assumptions and a buyer-validation action; track paid pilots separately from reported interest. That is a product hypothesis, not a proven advantage. Interview founders and incubator/advisor buyers, then measure completed paid pilots, delivery cost, refunds, and repeat use.</p>
      <small className="market-comparison-date">Public pages checked 1 October 2026. Competitor descriptions and prices can change.</small>
    </div>
  </details>;
}
