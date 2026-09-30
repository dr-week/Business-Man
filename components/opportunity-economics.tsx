"use client";

import { useState } from "react";
import { Calculator, Save, Sparkles, TrendingUp } from "lucide-react";
import { calculateEconomics, economicsInput, emptyEconomics, inr, type Economics } from "@/lib/economics";
import {
  BUSINESS_ARCHETYPES,
  calculateRevenueModel,
  type ArchetypeId,
} from "@/lib/revenue-models";

const fields = [
  ["price", "Selling price / unit", "₹"],
  ["variableCost", "Variable cost / unit", "₹"],
  ["monthlyUnits", "Monthly sales", "units"],
  ["fixedCost", "Monthly fixed costs", "₹"],
  ["investment", "Startup investment", "₹"],
] as const;

export function OpportunityEconomics({
  initial,
  onSave,
}: {
  initial?: Economics | null;
  onSave: (value: Economics) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Economics>(initial ?? emptyEconomics);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeId | "custom">("custom");
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(0);

  const parsed = economicsInput.safeParse(draft);
  const result = parsed.success ? calculateEconomics(parsed.data) : null;

  // Extended revenue model calculation if valid inputs
  const revenueDetails =
    parsed.success &&
    draft.price != null &&
    draft.variableCost != null &&
    draft.monthlyUnits != null &&
    draft.fixedCost != null &&
    draft.investment != null
      ? calculateRevenueModel({
          archetypeId: selectedArchetype === "custom" ? "saas_b2b" : selectedArchetype,
          price: draft.price,
          variableCost: draft.variableCost,
          monthlyUnits: draft.monthlyUnits,
          fixedCost: draft.fixedCost,
          investment: draft.investment,
          paymentTermsDays,
        })
      : null;

  function applyArchetype(id: ArchetypeId) {
    setSelectedArchetype(id);
    const arch = BUSINESS_ARCHETYPES[id];
    setDraft({
      price: arch.defaultPrice,
      variableCost: arch.defaultVariableCost,
      monthlyUnits: arch.defaultUnits,
      fixedCost: arch.defaultFixedCost,
      investment: arch.defaultInvestment,
      basis: `${arch.name}: ${arch.description} (Benchmark gross margin: ${arch.grossMarginRange})`,
    });
    setPaymentTermsDays(arch.workingCapitalCycleDays);
    setMessage(`Applied ${arch.name} benchmarks.`);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed.success || saving) return;
    setSaving(true);
    try {
      await onSave(parsed.data);
      setMessage("Saved assumptions.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="economics" aria-label="Economics calculator">
      <header>
        <div>
          <Calculator size={18} />
          <h2>Economics & Revenue System</h2>
          <span className="hunt-tag">India INR · Market Tested</span>
        </div>
      </header>

      {/* Archetype Quick-Starter Selector */}
      <div className="archetype-selector-bar">
        <span className="archetype-label">
          <Sparkles size={14} /> Revenue Archetype Preset:
        </span>
        <div className="archetype-buttons">
          {(Object.keys(BUSINESS_ARCHETYPES) as ArchetypeId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`archetype-btn ${selectedArchetype === id ? "is-selected" : ""}`}
              onClick={() => applyArchetype(id)}
            >
              {BUSINESS_ARCHETYPES[id].name.split("/")[0].trim()}
            </button>
          ))}
          <button
            type="button"
            className={`archetype-btn ${selectedArchetype === "custom" ? "is-selected" : ""}`}
            onClick={() => setSelectedArchetype("custom")}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="economics-layout">
        <form onSubmit={save}>
          <div className="economics-inputs">
            {fields.map(([key, label, unit]) => (
              <label key={key}>
                {label}
                <div>
                  <span>{unit}</span>
                  <input
                    type="number"
                    min="0"
                    max={key === "monthlyUnits" ? 1000000 : 1000000000}
                    step={key === "monthlyUnits" ? "1" : "0.01"}
                    aria-label={label}
                    placeholder="Unknown"
                    value={draft[key] ?? ""}
                    onChange={(event) => {
                      setDraft({
                        ...draft,
                        [key]: event.target.value === "" ? null : event.target.valueAsNumber,
                      });
                      setMessage("");
                    }}
                  />
                </div>
              </label>
            ))}

            {/* Payment terms / Working Capital Cycle */}
            <label>
              Working capital terms
              <div>
                <span>Days</span>
                <input
                  type="number"
                  min="0"
                  max="180"
                  step="5"
                  aria-label="Payment terms in days"
                  placeholder="0"
                  value={paymentTermsDays}
                  onChange={(e) => setPaymentTermsDays(e.target.valueAsNumber || 0)}
                />
              </div>
            </label>
          </div>

          <label className="economics-basis">
            Assumption sources & validation basis
            <textarea
              maxLength={1500}
              placeholder="e.g. Verified from competitor pricing page, supplier wholesale quote in Surat/Bengaluru, customer discovery calls..."
              value={draft.basis}
              onChange={(event) => setDraft({ ...draft, basis: event.target.value })}
            />
          </label>

          <button className="hunt-create-submit" disabled={saving || !parsed.success} type="submit">
            <Save size={15} />
            {saving ? "Saving…" : "Save assumptions"}
          </button>
          {message && <p role="status">{message}</p>}
        </form>

        <div>
          <div className="economics-results">
            <div>
              <span>Monthly revenue</span>
              <strong>{result ? inr(result.revenue) : "—"}</strong>
              {revenueDetails && (
                <small style={{ color: "#aaa99b", fontSize: "11px" }}>
                  ARR: {inr(revenueDetails.annualRunRate)}
                </small>
              )}
            </div>
            <div>
              <span>Operating profit / month</span>
              <strong className={result && result.profit < 0 ? "negative" : ""}>
                {result ? inr(result.profit) : "—"}
              </strong>
              {revenueDetails && (
                <small style={{ color: "#aaa99b", fontSize: "11px" }}>
                  Annual: {inr(revenueDetails.netAnnualProfit)}
                </small>
              )}
            </div>
            <div>
              <span>Operating margin</span>
              <strong>{result?.margin != null ? result.margin.toFixed(1) + "%" : "—"}</strong>
              {selectedArchetype !== "custom" && (
                <small style={{ color: "#aaa99b", fontSize: "11px" }}>
                  Benchmark: {BUSINESS_ARCHETYPES[selectedArchetype].grossMarginRange}
                </small>
              )}
            </div>
            <div>
              <span>Break-even volume</span>
              <strong>
                {result
                  ? result.breakEven
                    ? `${result.breakEven} ${selectedArchetype !== "custom" ? BUSINESS_ARCHETYPES[selectedArchetype].unitName : "units"}`
                    : "Not reachable"
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Capital Payback</span>
              <strong>
                {result
                  ? result.payback === null
                    ? "Not reached"
                    : `${result.payback.toFixed(1)} months`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Working Capital Locked</span>
              <strong>
                {revenueDetails && revenueDetails.workingCapitalLocked > 0
                  ? inr(revenueDetails.workingCapitalLocked)
                  : "₹0 (Advance)"}
              </strong>
              <small style={{ color: "#aaa99b", fontSize: "11px" }}>
                {paymentTermsDays > 0 ? `${paymentTermsDays} days cash cycle` : "Instant settlement / prepaid"}
              </small>
            </div>
          </div>

          {/* Scale Milestones */}
          {revenueDetails && (revenueDetails.targetScaleCustomers.for1LakhProfit || revenueDetails.targetScaleCustomers.for5LakhProfit) && (
            <div className="revenue-milestones">
              <span className="milestone-title">
                <TrendingUp size={14} /> Scale Targets for India:
              </span>
              <div className="milestone-chips">
                {revenueDetails.targetScaleCustomers.for1LakhProfit && (
                  <div className="milestone-chip">
                    <strong>{revenueDetails.targetScaleCustomers.for1LakhProfit}</strong>
                    <span>{selectedArchetype !== "custom" ? BUSINESS_ARCHETYPES[selectedArchetype].unitName : "units"} for <strong>₹1 Lakh/mo profit</strong></span>
                  </div>
                )}
                {revenueDetails.targetScaleCustomers.for5LakhProfit && (
                  <div className="milestone-chip">
                    <strong>{revenueDetails.targetScaleCustomers.for5LakhProfit}</strong>
                    <span>{selectedArchetype !== "custom" ? BUSINESS_ARCHETYPES[selectedArchetype].unitName : "units"} for <strong>₹5 Lakh/mo profit</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stress Scenarios / Sensitivity Chart */}
          {revenueDetails ? (
            <figure className="economics-chart">
              <figcaption>Stress Scenarios & Margin Resilience (System-1 Fast Check)</figcaption>
              {revenueDetails.stressScenarios.map((scenario) => (
                <div className="scenario" key={scenario.label}>
                  <span>
                    {scenario.label}
                    <small>{scenario.description}</small>
                  </span>
                  <div className="scenario-track">
                    <i
                      className={scenario.monthlyProfit < 0 ? "negative" : ""}
                      style={{
                        width: `${
                          (Math.abs(scenario.monthlyProfit) /
                            Math.max(
                              1,
                              ...revenueDetails.stressScenarios.map((item) => Math.abs(item.monthlyProfit))
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <strong className={scenario.monthlyProfit < 0 ? "negative" : ""}>
                    {inr(scenario.monthlyProfit)}
                  </strong>
                </div>
              ))}
            </figure>
          ) : result ? (
            <figure className="economics-chart">
              <figcaption>Illustrative profit sensitivity · not a forecast</figcaption>
              {result.scenarios.map((scenario) => (
                <div className="scenario" key={scenario.label}>
                  <span>
                    {scenario.label}
                    <small>{scenario.units} units</small>
                  </span>
                  <div className="scenario-track">
                    <i
                      className={scenario.profit < 0 ? "negative" : ""}
                      style={{
                        width: `${
                          (Math.abs(scenario.profit) /
                            Math.max(1, ...result.scenarios.map((item) => Math.abs(item.profit)))) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <strong>{inr(scenario.profit)}</strong>
                </div>
              ))}
            </figure>
          ) : (
            <div className="economics-placeholder">Enter assumptions or pick an archetype above</div>
          )}

          {result && (
            <details className="economics-method">
              <summary>Break-even & Threshold Targets</summary>
              <p>
                At entered sales volume: break-even price{" "}
                {result.breakEvenTargets.priceFloor === null ? "—" : inr(result.breakEvenTargets.priceFloor)}{" "}
                per unit; break-even variable-cost ceiling{" "}
                {result.breakEvenTargets.variableCostCeiling === null
                  ? "—"
                  : inr(result.breakEvenTargets.variableCostCeiling)}{" "}
                per unit; break-even fixed-cost ceiling{" "}
                {result.breakEvenTargets.fixedCostCeiling === null
                  ? "unreachable"
                  : inr(result.breakEvenTargets.fixedCostCeiling) + " per month"}.{" "}
                {result.breakEvenTargets.additionalUnits === null
                  ? "Unit break-even is unreachable at current price and variable cost."
                  : result.breakEvenTargets.additionalUnits === 0
                  ? "Entered volume already meets unit break-even."
                  : `${result.breakEvenTargets.additionalUnits} more units reach break-even at current price and costs.`}
              </p>
            </details>
          )}

          <details className="economics-method">
            <summary>Revenue Engine Logic</summary>
            <p>
              In India, working capital drag and payment delays (e.g. 30–60 day credit terms or e-commerce COD cycles)
              cause high mortality for early businesses despite book profits. This module explicitly calculates cash
              locked in working capital alongside unit contribution margins.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
