import { independentSourceCount } from "@/lib/evidence-lineage";
import type { ResearchOpportunity } from "@/lib/research-engine";

const amount = (value: number | null | undefined, currency: string) => value == null
  ? "—"
  : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export function OpportunityComparison({ opportunities, currency }: { opportunities: ResearchOpportunity[]; currency: string }) {
  return <div className="opportunity-comparison" role="region" aria-label="Opportunity comparison" tabIndex={0}>
    <table>
      <thead><tr><th scope="col">Opportunity</th><th scope="col">Evidence</th><th scope="col">Independent sources</th><th scope="col">Initial investment</th><th scope="col">Base monthly profit</th></tr></thead>
      <tbody>{opportunities.map((item) => <tr key={item.id}>
        <th scope="row">{item.name}</th>
        <td>{item.factors.filter((factor) => factor.score != null).length} / 5</td>
        <td>{independentSourceCount(item.sources)}</td>
        <td>{amount(item.financials?.funding, currency)}</td>
        <td>{amount(item.financials?.scenarios.find((scenario) => scenario.name === "Base")?.profit, currency)}</td>
      </tr>)}</tbody>
    </table>
    <small>Financials use each opportunity’s assumptions; blank means unknown, not zero.</small>
  </div>;
}
