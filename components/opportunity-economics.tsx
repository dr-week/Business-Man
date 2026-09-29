"use client";

import { useState } from "react";
import { Calculator, Save } from "lucide-react";
import { calculateEconomics, economicsInput, emptyEconomics, inr, type Economics } from "@/lib/economics";

const fields = [
  ["price", "Selling price / unit", "₹"],
  ["variableCost", "Variable cost / unit", "₹"],
  ["monthlyUnits", "Monthly sales", "units"],
  ["fixedCost", "Monthly fixed costs", "₹"],
  ["investment", "Startup investment", "₹"],
] as const;

export function OpportunityEconomics({ initial, onSave }: { initial?: Economics | null; onSave: (value: Economics) => Promise<void> }) {
  const [draft, setDraft] = useState<Economics>(initial ?? emptyEconomics);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const parsed = economicsInput.safeParse(draft);
  const result = parsed.success ? calculateEconomics(parsed.data) : null;
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed.success || saving) return;
    setSaving(true);
    try { await onSave(parsed.data); setMessage("Saved assumptions."); }
    catch (error) { setMessage((error as Error).message); }
    finally { setSaving(false); }
  }
  return <section className="economics" aria-label="Economics calculator">
    <header><div><Calculator size={18} /><h2>Economics</h2><span className="hunt-tag">INR · Estimate</span></div></header>
    <div className="economics-layout">
      <form onSubmit={save}>
        <div className="economics-inputs">{fields.map(([key, label, unit]) => <label key={key}>{label}<div><span>{unit}</span><input type="number" min="0" max={key === "monthlyUnits" ? 1000000 : 1000000000} step={key === "monthlyUnits" ? "1" : "0.01"} aria-label={label} placeholder="Unknown" value={draft[key] ?? ""} onChange={(event) => { setDraft({ ...draft, [key]: event.target.value === "" ? null : event.target.valueAsNumber }); setMessage(""); }} /></div></label>)}</div>
        <label className="economics-basis">Assumption sources<textarea maxLength={1500} placeholder="Buyer quote, supplier quote, date…" value={draft.basis} onChange={(event) => setDraft({ ...draft, basis: event.target.value })} /></label>
        <button className="hunt-create-submit" disabled={saving || !parsed.success} type="submit"><Save size={15} />{saving ? "Saving…" : "Save assumptions"}</button>
        {message && <p role="status">{message}</p>}
      </form>
      <div>
        <div className="economics-results">
          <div><span>Monthly revenue</span><strong>{result ? inr(result.revenue) : "—"}</strong></div>
          <div><span>Operating profit / month</span><strong className={result && result.profit < 0 ? "negative" : ""}>{result ? inr(result.profit) : "—"}</strong></div>
          <div><span>Operating margin</span><strong>{result?.margin != null ? result.margin.toFixed(1) + "%" : "—"}</strong></div>
          <div><span>Break-even units / month</span><strong>{result ? result.breakEven ?? "Not reachable" : "—"}</strong></div>
          <div><span>Simple payback</span><strong>{result ? result.payback === null ? "Not reached" : `${result.payback.toFixed(1)} months` : "—"}</strong></div>
        </div>
        {result ? <figure className="economics-chart"><figcaption>Illustrative profit sensitivity · not a forecast</figcaption>
          {result.scenarios.map((scenario) => <div className="scenario" key={scenario.label}><span>{scenario.label}<small>{scenario.units} units</small></span><div className="scenario-track"><i className={scenario.profit < 0 ? "negative" : ""} style={{ width: `${Math.abs(scenario.profit) / Math.max(1, ...result.scenarios.map((item) => Math.abs(item.profit))) * 100}%` }} /></div><strong>{inr(scenario.profit)}</strong></div>)}
        </figure> : <div className="economics-placeholder">Enter assumptions</div>}
        <details className="economics-method"><summary>Calculation basis</summary><p>The 50%, 100%, and 150% rows scale entered monthly sales; they are sensitivity cases, not demand forecasts. Profit = (price − variable cost) × units − fixed costs. Margin = profit ÷ revenue. Break-even = fixed costs ÷ contribution per unit, rounded up. Payback = investment ÷ positive monthly profit. Constant monthly sales assumed; taxes, financing and changes in working capital are excluded. Investment should include startup working capital.</p></details>
      </div>
    </div>
  </section>;
}
