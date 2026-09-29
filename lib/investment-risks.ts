type FinancialSnapshot = {
  funding: number;
  contribution: number;
  scenarios: { name: string; profit: number }[];
};

/** Decision flags derived only from explicit financial inputs. */
export function investmentRisks(financials: FinancialSnapshot | null, maximumBudget: number | null, currency: string): string[] {
  if (!financials) return ["Costs and sales volume unknown"];
  const amount = (value: number) => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const risks: string[] = [];
  if (maximumBudget === null) risks.push("Budget fit unknown");
  else if (financials.funding > maximumBudget) risks.push(`Funding exceeds budget by ${amount(financials.funding - maximumBudget)}`);
  if (financials.contribution <= 0) risks.push("Variable cost meets or exceeds price");
  const low = financials.scenarios.find((scenario) => scenario.name === "Low");
  if (low && low.profit < 0) risks.push(`Low-sales scenario loses ${amount(-low.profit)} / month`);
  return risks;
}
