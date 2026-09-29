export type ValidationAction = { missing: string; test: string; method: string; evidence: string; decision: string };

const MAX_ACTIONS = 20;
const MAX_LABEL_LENGTH = 160;

const actions: Record<string, Omit<ValidationAction, "missing">> = {
  "Named buyer": { test: "Identify the person who owns this problem and budget.", method: "Speak with people in the target role; ask who approves a purchase and what they use now.", evidence: "Role, buying authority, current workaround, and a recent example.", decision: "Drop or narrow the buyer segment if no reachable owner recognizes the problem." },
  "Paid demand": { test: "Look for a real buying commitment.", method: "Offer a small paid pilot, preorder, or deposit before building the full solution.", evidence: "A paid order, deposit, or signed purchase commitment; stated interest alone does not count.", decision: "Do not treat positive opinions as proof of willingness to pay." },
  "Verified paid demand": { test: "Verify the reported payment independently.", method: "Confirm a redacted invoice, receipt, contract, or repeat purchase with the buyer.", evidence: "Traceable transaction, date, amount, and buyer type.", decision: "Keep paid demand unknown if the transaction cannot be checked." },
  "Recurring failure": { test: "Measure how often the problem happens and what it costs.", method: "Ask buyers to walk through the last occurrence and review their time, loss, delay, or rework records.", evidence: "Recent examples with frequency and a measurable cost or consequence.", decision: "Reframe if the issue is rare or has no material cost." },
  "Alternative gap": { test: "Find where current alternatives fail.", method: "Compare the buyer's current workaround and named products on price, effort, and the unmet job.", evidence: "Observed limitation buyers can demonstrate, not a presumed competitor weakness.", decision: "Do not claim a gap if existing options solve the job at acceptable cost." },
  "Named competitor comparison": { test: "Map direct and indirect alternatives.", method: "Check local providers, products, manual workarounds, and supplier offers; record dated source links.", evidence: "Comparable offers, service area, terms, and price where published.", decision: "Reconsider if a well-positioned alternative already serves the target buyer." },
  "Local feasibility": { test: "Check whether the business can operate in this location and budget.", method: "Confirm permits with the relevant authority and request local supplier, equipment, rent, and competitor quotes.", evidence: "Current local requirements and dated quotes tied to the same geography and unit.", decision: "Stop or redesign if mandatory costs exceed the available capital." },
  "Pricing, costs, and scenario volumes": { test: "Replace financial unknowns with traceable inputs.", method: "Get buyer price commitments, supplier quotes, fixed-cost estimates, and a volume basis for low/base/high cases.", evidence: "Each input has source or rationale, date, geography, currency, and unit.", decision: "Keep profit and payback unknown until all required inputs are supported." },
};

export function buildValidationPlan(missing: readonly string[]): ValidationAction[] {
  const labels = [...new Set(missing.map((item) => item.trim()).filter((item) => item.length > 0).map((item) => item.slice(0, MAX_LABEL_LENGTH)))].slice(0, MAX_ACTIONS);
  return labels.map((item) => ({ missing: item, ...(actions[item] ?? {
    test: `Resolve: ${item}.`, method: "Find the primary source or buyer who can answer this question.",
    evidence: "A dated, traceable source or direct buyer observation.", decision: "Keep the assumption unknown until the evidence is checked.",
  }) }));
}
