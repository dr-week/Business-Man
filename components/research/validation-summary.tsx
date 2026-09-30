import type { Lead } from "@/lib/opportunity-hunt";
import { summarizeValidationOutcomes } from "@/lib/validation-summary";

export function ValidationSummary({ leads }: { leads: readonly Lead[] }) {
  const summary = summarizeValidationOutcomes(leads);
  const money = (amount: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  return <section aria-label="Buyer validation summary" className="validation-summary">
    <div><strong>{summary.pilotsOffered}</strong><span>Pilots offered</span></div>
    <div><strong>{summary.paidSignals}</strong><span>Paid pilot / repeat signals</span></div>
    <div><strong>{summary.repeatPurchases}</strong><span>Repeat purchases</span></div>
    <div className="validation-summary-amount"><strong>{summary.paymentsByCurrency.length ? summary.paymentsByCurrency.map(({ currency, amount }) => money(amount, currency)).join(" · ") : "—"}</strong><span>Recorded paid amounts</span></div>
    <small>Owner-reported records only; not independently verified or a revenue forecast.</small>
  </section>;
}
