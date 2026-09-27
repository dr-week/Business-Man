import { describe, it, expect } from "vitest";
import { generateBusinessExecutionPlan } from "@/lib/business-engine";
import { Lead } from "@/lib/opportunity-hunt";

const sampleLead: Lead = {
  id: "lead-test-1",
  title: "Packhouse Cold-Chain Sensor",
  lane: "Crop systems",
  failure: "Produce rots during transit due to undetected container cooling breakdowns.",
  buyer: "Export packhouse logistics managers",
  trigger: "New EU import inspection penalty rules",
  source: "https://example.gov/cold-chain-report",
  alternatives: "Manual temperature logs on paper sheets",
  payment: "500 USD per container shipment",
  nextTest: "Run 5 logger probes on test shipments",
  createdAt: "2026-09-26",
};

describe("Business Execution Engine", () => {
  it("generates a 5-step concrete execution plan for a lead", () => {
    const plan = generateBusinessExecutionPlan(sampleLead);
    expect(plan.steps.length).toBe(5);
    expect(plan.steps[0].phase).toBe("Signal");
    expect(plan.steps[4].phase).toBe("Pilot");
  });

  it("marks steps up to current gate as completed when verified", () => {
    const plan = generateBusinessExecutionPlan(sampleLead);
    // All info up to payment is provided, so gate is Pilot (step 5)
    expect(plan.currentGate).toBe("Pilot");
    expect(plan.steps[0].isComplete).toBe(true);
    expect(plan.steps[1].isComplete).toBe(true);
    expect(plan.steps[2].isComplete).toBe(true);
    expect(plan.steps[3].isComplete).toBe(true);
  });

  it("flags unit economics risks when payment is unverified", () => {
    const unverifiedLead: Lead = {
      ...sampleLead,
      payment: "Unverified",
    };
    const plan = generateBusinessExecutionPlan(unverifiedLead);
    expect(plan.unitEconomics.riskFlags.some((f) => f.includes("Willingness to pay"))).toBe(true);
  });
});
