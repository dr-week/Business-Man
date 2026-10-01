import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { blankFinancials, type ResearchOpportunity } from "@/lib/research-engine";
import { FinancialEditor, summarizeQuickEvidence } from "./financial-editor";

const item = {
  id: "investment-screen",
  name: "Local service",
  category: "Services",
  geography: "Pune, India",
  buyer: "Local businesses",
  problem: "",
  offering: null,
  alternatives: [],
  gap: null,
  risks: [],
  sources: [],
  claims: [],
  assumptions: blankFinancials({ topic: "Local service", geography: "Pune, India", budget: null, currency: "INR" }),
  factors: [],
  strength: null,
  confidence: "Low",
  financials: null,
  missing: [],
} satisfies ResearchOpportunity;

describe("investment quick-screen evidence cue", () => {
  it("identifies assumptions without a source or rationale", () => {
    const assumptions = { ...item.assumptions };
    assumptions.price = { ...assumptions.price, note: "Supplier quote" };

    expect(summarizeQuickEvidence(assumptions)).toEqual({
      documented: 1,
      total: 4,
      missing: ["variableCost", "fixedCost", "baseVolume"],
    });
  });

  it("renders the missing quick-screen assumptions without opening evidence panels", () => {
    const html = renderToStaticMarkup(createElement(FinancialEditor, { item, onChange: () => undefined }));

    expect(html).toContain("0/4 assumptions documented");
    expect(html).toContain("Selling price, Variable cost, Monthly fixed cost, Base monthly volume");
  });
});
