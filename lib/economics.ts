import { z } from "zod";

const amount = z.number().finite().min(0).max(1_000_000_000).nullable();
export const economicsInput = z.object({
  price: amount,
  variableCost: amount,
  monthlyUnits: z.number().int().min(0).max(1_000_000).nullable(),
  fixedCost: amount,
  investment: amount,
  basis: z.string().trim().max(1500),
});
export type Economics = z.infer<typeof economicsInput>;
export const emptyEconomics: Economics = { price: null, variableCost: null, monthlyUnits: null, fixedCost: null, investment: null, basis: "" };

export function calculateEconomics(input: Economics) {
  const { price, variableCost, monthlyUnits, fixedCost, investment } = input;
  if (price === null || variableCost === null || monthlyUnits === null || fixedCost === null || investment === null) return null;
  const contribution = price - variableCost;
  const revenue = price * monthlyUnits;
  const profit = contribution * monthlyUnits - fixedCost;
  return {
    revenue, profit, contribution,
    margin: revenue > 0 ? profit / revenue * 100 : null,
    breakEven: contribution > 0 ? Math.ceil(fixedCost / contribution) : null,
    payback: profit > 0 ? investment / profit : null,
    breakEvenTargets: {
      priceFloor: monthlyUnits > 0 ? variableCost + fixedCost / monthlyUnits : null,
      variableCostCeiling: monthlyUnits > 0 ? price - fixedCost / monthlyUnits : null,
      fixedCostCeiling: contribution > 0 ? contribution * monthlyUnits : null,
      additionalUnits: contribution > 0 ? Math.max(0, Math.ceil(fixedCost / contribution) - monthlyUnits) : null,
    },
    scenarios: [0.5, 1, 1.5].map((factor) => {
      const units = Math.round(monthlyUnits * factor);
      return { label: `${factor * 100}% sales`, units, profit: contribution * units - fixedCost };
    }),
  };
}

export const inr = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
