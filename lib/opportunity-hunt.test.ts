import { describe, it, expect } from "vitest";
import { nextGate, missingProof, Lead } from "@/lib/opportunity-hunt";

const baseLead: Lead = {
  id: "test-lead-1",
  title: "Industrial valve monitoring",
  lane: "Industrial process",
  failure: "Valve failure leads to unexpected plant shutdown and hazardous leaks.",
  buyer: "Plant maintenance managers",
  trigger: "New safety compliance audit standards",
  source: "https://example.gov/safety-report.pdf",
  alternatives: "Manual walk-around checks with clipboard logging",
  payment: "10,000 USD annual budget per unit",
  nextTest: "Run a 2-week acoustic sensor pilot on 3 problematic lines",
  createdAt: "2026-09-25",
};

describe("Opportunity Hunt Gate Logic", () => {
  it("advances to Pilot when all initial evidence criteria are met", () => {
    expect(nextGate(baseLead)).toBe("Pilot");
  });

  it("identifies gate as Signal if source or failure is unverified or empty", () => {
    const leadWithoutSource: Lead = {
      ...baseLead,
      source: "Founder-supplied hearsay",
    };
    expect(nextGate(leadWithoutSource)).toBe("Signal");
    expect(missingProof(leadWithoutSource)).toContain("traceable signal");
  });

  it("identifies gate as Buyer if buyer is empty", () => {
    const leadWithoutBuyer: Lead = {
      ...baseLead,
      buyer: "",
    };
    expect(nextGate(leadWithoutBuyer)).toBe("Buyer");
    expect(missingProof(leadWithoutBuyer)).toContain("Name the person");
  });

  it("identifies gate as Alternatives if alternatives say audit needed or unknown", () => {
    const leadWithUnknownAlt: Lead = {
      ...baseLead,
      alternatives: "competitor audit needed",
    };
    expect(nextGate(leadWithUnknownAlt)).toBe("Alternatives");
  });

  it("identifies gate as Economics if payment is unverified", () => {
    const leadUnverifiedPayment: Lead = {
      ...baseLead,
      payment: "Unverified",
    };
    expect(nextGate(leadUnverifiedPayment)).toBe("Economics");
  });
});
