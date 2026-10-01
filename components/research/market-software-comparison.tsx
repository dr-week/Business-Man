import styles from "./market-software-comparison.module.scss";
import { marketCompetitors } from "@/lib/market-competitors";

export function MarketSoftwareComparison() {
  return <section className={`research-detail-card ${styles.comparison}`} aria-labelledby="market-software-heading">
    <h3 id="market-software-heading">Competitor comparison</h3>
    <p>Adjacent tools sell a report, a planning workspace, experiments, or company data. Pricing is a market signal, not proof of demand for BUSINESSman.</p>
    <p className={styles.hypothesis}><strong>Positioning to validate:</strong> one location-specific shortlist that links buyer and competitor evidence to transparent financial scenarios. Ask founders and advisors whether this combined decision brief is worth paying for.</p>
    <details>
      <summary>Compare 4 products, features, and published pricing</summary>
      <div className={styles.products}>
        {marketCompetitors.map((product) => <article key={product.name}>
          <h4>{product.name}</h4>
          <p><strong>{product.focus}</strong></p>
          <p>{product.offer}</p>
          <p><strong>Published price:</strong> {product.price}</p>
          <p className={styles.boundary}><strong>Scope boundary:</strong> {product.boundary}</p>
          <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${product.name} official pricing`}>Official pricing ↗</a>
        </article>)}
      </div>
      <small>Official pages checked 1 October 2026. Prices and plan terms can change; recheck before purchase.</small>
    </details>
  </section>;
}
