// EconomicsSlider.tsx – Interactive economics scenario sliders
// ---------------------------------------------------------------
// This component provides a set of three Tailwind‑styled range sliders
// (price, variableCost, monthlyUnits) that directly feed the `calculateEconomics`
// function from `lib/economics.ts`. The UI updates the calculated revenue,
// profit, break‑even, payback and scenario table on‑the‑fly, giving users
// immediate feedback – a clear UX win over the static form currently used.
// ---------------------------------------------------------------

import { useState, useEffect } from "react";
import { calculateEconomics, inr } from "../lib/economics";
import type { Economics } from "../lib/economics";

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
    <div className="flex flex-col gap-6 p-4 bg-[#171a14] rounded-xl border border-[#35392e]">
      <h2 className="text-lg font-semibold text-[#eeeae0]">Economic Scenario Builder</h2>

      {/* ------- Slider Controls ------- */}
      <div className="grid gap-4">
        {/* Price */}
        <label className="flex flex-col text-[#a29f94]">
          <span>Price (₹)</span>
          <input
            type="range"
            min="0"
            max="500000"
            step="1000"
            value={form.price ?? 0}
            onChange={(e) => updateField("price", e.target.value)}
            className="w-full h-2 bg-[#414735] rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-[#a29f94]">{form.price ?? 0}</span>
        </label>

        {/* Variable Cost */}
        <label className="flex flex-col text-[#a29f94]">
          <span>Variable Cost (₹)</span>
          <input
            type="range"
            min="0"
            max="500000"
            step="1000"
            value={form.variableCost ?? 0}
            onChange={(e) => updateField("variableCost", e.target.value)}
            className="w-full h-2 bg-[#414735] rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-[#a29f94]">{form.variableCost ?? 0}</span>
        </label>

        {/* Monthly Units */}
        <label className="flex flex-col text-[#a29f94]">
          <span>Monthly Units</span>
          <input
            type="range"
            min="0"
            max="100000"
            step="100"
            value={form.monthlyUnits ?? 0}
            onChange={(e) => updateField("monthlyUnits", e.target.value)}
            className="w-full h-2 bg-[#414735] rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-[#a29f94]">{form.monthlyUnits ?? 0}</span>
        </label>
      </div>

      {/* ------- Calculated Results ------- */}
      {result ? (
        <div className="grid grid-cols-2 gap-4 text-[#a29f94]">
          <div>
            <strong className="text-[#eeeae0]">Revenue</strong>: {inr(result.revenue)}
          </div>
          <div>
            <strong className="text-[#eeeae0]">Profit</strong>: {inr(result.profit)}
          </div>
          <div>
            <strong className="text-[#eeeae0]">Margin</strong>: {result.margin?.toFixed(1) ?? "–"}%
          </div>
          <div>
            <strong className="text-[#eeeae0]">Break‑Even Units</strong>: {result.breakEven ?? "–"}
          </div>
          <div>
            <strong className="text-[#eeeae0]">Payback (months)</strong>: {result.payback?.toFixed(1) ?? "–"}
          </div>
        </div>
      ) : (
        <p className="text-[#a29f94]">Enter all values to see calculations.</p>
      )}
    </div>
  );
}
