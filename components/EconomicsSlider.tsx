import { useState, useEffect } from "react";
import { calculateEconomics, inr } from "../lib/economics";
import type { Economics } from "../lib/economics";
import styles from "./EconomicsSlider.module.scss";

export default function EconomicsSlider({
  initial = {
    price: null,
    variableCost: null,
    monthlyUnits: null,
    fixedCost: null,
    investment: null,
    basis: "",
  },
  onChange,
}: {
  initial?: Economics;
  onChange?: (e: ReturnType<typeof calculateEconomics> | null) => void;
}) {
  const [form, setForm] = useState<Economics>(initial);

  // Re‑calculate whenever inputs change
  const result = calculateEconomics(form);

  useEffect(() => {
    if (onChange) onChange(result);
  }, [result, onChange]);

  const updateField = (field: keyof Economics, value: string) => {
    const num = value === "" ? null : Number(value);
    setForm((prev) => ({ ...prev, [field]: num === null || Number.isNaN(num) ? null : num }));
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Economic Scenario Builder</h2>

      {/* ------- Slider Controls ------- */}
      <div className={styles.controls}>
        {/* Price */}
        <label className={styles.control}>
          <span>Price (₹)</span>
          <input
            type="range"
            min="0"
            max="500000"
            step="1000"
            value={form.price ?? 0}
            onChange={(e) => updateField("price", e.target.value)}
            className={styles.slider}
          />
          <span className={styles.value}>{form.price ?? 0}</span>
        </label>

        {/* Variable Cost */}
        <label className={styles.control}>
          <span>Variable Cost (₹)</span>
          <input
            type="range"
            min="0"
            max="500000"
            step="1000"
            value={form.variableCost ?? 0}
            onChange={(e) => updateField("variableCost", e.target.value)}
            className={styles.slider}
          />
          <span className={styles.value}>{form.variableCost ?? 0}</span>
        </label>

        {/* Monthly Units */}
        <label className={styles.control}>
          <span>Monthly Units</span>
          <input
            type="range"
            min="0"
            max="100000"
            step="100"
            value={form.monthlyUnits ?? 0}
            onChange={(e) => updateField("monthlyUnits", e.target.value)}
            className={styles.slider}
          />
          <span className={styles.value}>{form.monthlyUnits ?? 0}</span>
        </label>
      </div>

      {/* ------- Calculated Results ------- */}
      {result ? (
        <div className={styles.results}>
          <div>
            <strong>Revenue</strong>: {inr(result.revenue)}
          </div>
          <div>
            <strong>Profit</strong>: {inr(result.profit)}
          </div>
          <div>
            <strong>Margin</strong>: {result.margin?.toFixed(1) ?? "–"}%
          </div>
          <div>
            <strong>Break‑Even Units</strong>: {result.breakEven ?? "–"}
          </div>
          <div>
            <strong>Payback (months)</strong>: {result.payback?.toFixed(1) ?? "–"}
          </div>
        </div>
      ) : (
        <p className={styles.empty}>Enter all values to see calculations.</p>
      )}
    </section>
  );
}
