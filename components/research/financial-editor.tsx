"use client";

import { useState, useEffect } from "react";
import type { FinancialAssumptions, Provenance, ResearchOpportunity } from "@/lib/research-engine";
import { calculateFinancials } from "@/lib/research-engine";
import { priceBenchmarks, estimatePriceFromBenchmark } from "@/lib/price-benchmarks";
import { FinancialCsvImport } from "./financial-csv-import";
import styles from "./financial-editor.module.scss";

export const fields = [
  ["price", "Selling price"],
  ["variableCost", "Variable cost"],
  ["fixedCost", "Monthly fixed cost"],
  ["setupCost", "Setup"],
  ["equipmentCost", "Equipment"],
  ["openingInventory", "Opening inventory"],
  ["reserve", "Working capital reserve"],
  ["lowVolume", "Low monthly volume"],
  ["baseVolume", "Base monthly volume"],
  ["highVolume", "High monthly volume"],
] as const;

export type Field = typeof fields[number][0];

export function FinancialEditor({
  item,
  onChange,
}: {
  item: ResearchOpportunity;
  onChange: (value: FinancialAssumptions) => void;
}) {
  const [draft, setDraft] = useState(item.assumptions);

  useEffect(() => setDraft(item.assumptions), [item.id, item.assumptions]);

  function edit(field: Field, patch: Partial<FinancialAssumptions[Field]>) {
    setDraft((current) => ({ ...current, [field]: { ...current[field], ...patch } }));
  }

  const valid = calculateFinancials(draft) !== null;
  const benchmarks = priceBenchmarks(item.sources, draft.currency);
  const quickKeys = ["price", "variableCost", "fixedCost", "baseVolume"] as const;
  const quickReady = quickKeys.every((key) => {
    const value = draft[key].value;
    return value !== null && Number.isFinite(value) && value >= 0 && (key !== "baseVolume" || Number.isInteger(value));
  });
  const contribution = (draft.price.value ?? 0) - (draft.variableCost.value ?? 0);
  const quickProfit = contribution * (draft.baseVolume.value ?? 0) - (draft.fixedCost.value ?? 0);
  const detailedFields = fields.filter(([field]) => !quickKeys.includes(field as typeof quickKeys[number]));

  return (
    <details className="research-assumptions">
      <summary>Model financial assumptions</summary>

      <p>Enter comparable price, costs, funding, and low/base/high monthly volumes. Each amount retains provenance and date.</p>

      <section className={styles.quickScreen} aria-label="Quick investment screen">
        <h4>Quick screen</h4>
        <p>Start with four numbers for a base-month profit check. Add capital and low/high cases for payback analysis.</p>
        <div className="research-assumption-grid">
          {fields.filter(([field]) => quickKeys.includes(field as typeof quickKeys[number])).map(([field, label]) => (
            <fieldset key={field}>
              <legend>{label} · {draft[field].unit}</legend>
              <input
                aria-label={label}
                type="number"
                min="0"
                step={field.toLowerCase().includes("volume") ? "1" : "0.01"}
                placeholder="Missing"
                value={draft[field].value ?? ""}
                onChange={(event) => edit(field, {
                  value: event.target.value === "" ? null : Number(event.target.value),
                  provenance: event.target.value === "" ? "Missing" : "User-entered",
                  date: event.target.value === "" ? null : new Date().toISOString().slice(0, 10),
                })}
              />
              <details className={styles.evidenceDetails}>
                <summary>Evidence details</summary>
                <select aria-label={label + " provenance"} value={draft[field].provenance} onChange={(event) => edit(field, { provenance: event.target.value as Provenance })}>
                  <option>Missing</option><option>User-entered</option><option>Estimated</option><option>Sourced</option>
                </select>
                <input aria-label={label + " date"} type="date" value={draft[field].date ?? ""} onChange={(event) => edit(field, { date: event.target.value || null })} />
                <input aria-label={label + " source or rationale"} placeholder="Source URL or rationale" value={draft[field].note} onChange={(event) => edit(field, { note: event.target.value })} />
                <select aria-label={label + " source"} value={draft[field].sourceIds[0] ?? ""} onChange={(event) => edit(field, { sourceIds: event.target.value ? [event.target.value] : [] })}>
                  <option value="">No linked source</option>
                  {item.sources.map((source) => <option key={source.id} value={source.id}>{source.provider}: {source.title.slice(0, 50)}</option>)}
                </select>
              </details>
            </fieldset>
          ))}
        </div>
        <div className={styles.quickResult} role="status" aria-live="polite">
          <span>Base-month operating profit</span>
          <strong>{quickReady ? new Intl.NumberFormat(undefined, { style: "currency", currency: draft.currency, maximumFractionDigits: 0 }).format(quickProfit) : "Add the four amounts"}</strong>
          {quickReady && <small>{contribution > 0 ? `Break-even: ${Math.ceil((draft.fixedCost.value ?? 0) / contribution)} ${draft.unit}s / month` : "Break-even unavailable: contribution per unit is zero or negative."}</small>}
          <small>Arithmetic from entered assumptions; not a forecast or investment recommendation.</small>
        </div>
      </section>

      {!!benchmarks.length && (
        <details>
          <summary>Advertised price benchmarks ({benchmarks.length})</summary>
          <ul>
            {benchmarks.map((benchmark, index) => (
              <li key={benchmark.sourceId + index}>
                <a href={benchmark.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {benchmark.product}
                </a>
                : {benchmark.quote} · Collected {benchmark.collectedAt.slice(0, 10)}{" "}
                <button type="button" onClick={() => setDraft((current) => estimatePriceFromBenchmark(current, benchmark))}>
                  Use as estimated price
                </button>
              </li>
            ))}
          </ul>
          <small>Advertised competitor price. Confirm sales unit and local applicability before using it in a decision.</small>
        </details>
      )}

      <label>
        Sales unit
        <input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} />
      </label>

      <FinancialCsvImport onImport={(values, filename) => setDraft((current) => {
        const next = { ...current };
        const date = new Date().toISOString().slice(0, 10);
        for (const [key, value] of Object.entries(values) as [Field, number][]) {
          next[key] = { ...current[key], value, provenance: "User-entered", date, sourceIds: [], note: `Imported from ${filename}` };
        }
        return next;
      })} />

      <details className={styles.advancedFields}>
        <summary>Capital, scenario range, and source details</summary>
        <p>Complete these inputs to calculate full funding, low/base/high scenarios, and payback. Record a source or rationale for each assumption.</p>
        <div className="research-assumption-grid">
        {detailedFields.map(([field, label]) => (
          <fieldset key={field}>
            <legend>
              {label} · {draft[field].unit}
            </legend>

            <input
              aria-label={label}
              type="number"
              min="0"
              step={field.toLowerCase().includes("volume") ? "1" : "0.01"}
              placeholder="Missing"
              value={draft[field].value ?? ""}
              onChange={(event) =>
                edit(field, {
                  value: event.target.value === "" ? null : Number(event.target.value),
                  provenance: event.target.value === "" ? "Missing" : "User-entered",
                  date: event.target.value === "" ? null : new Date().toISOString().slice(0, 10),
                })
              }
            />

            <select
              aria-label={label + " provenance"}
              value={draft[field].provenance}
              onChange={(event) => edit(field, { provenance: event.target.value as Provenance })}
            >
              <option>Missing</option>
              <option>User-entered</option>
              <option>Estimated</option>
              <option>Sourced</option>
            </select>

            <input
              aria-label={label + " date"}
              type="date"
              value={draft[field].date ?? ""}
              onChange={(event) => edit(field, { date: event.target.value || null })}
            />

            <input
              aria-label={label + " source or rationale"}
              placeholder="Source URL or rationale"
              value={draft[field].note}
              onChange={(event) => edit(field, { note: event.target.value })}
            />

            <select
              aria-label={label + " source"}
              value={draft[field].sourceIds[0] ?? ""}
              onChange={(event) => edit(field, { sourceIds: event.target.value ? [event.target.value] : [] })}
            >
              <option value="">No linked source</option>
              {item.sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.provider}: {source.title.slice(0, 50)}
                </option>
              ))}
            </select>
          </fieldset>
        ))}
        </div>
      </details>

      <button className="hunt-create-submit" disabled={!valid} onClick={() => onChange(draft)}>
        Apply assumptions
      </button>

      {!valid && <small>Complete all amounts and ordered scenario volumes to calculate figures.</small>}
    </details>
  );
}
