import { describe, it, expect } from "vitest";
import { nextGate, missingProof, Lead } from "@/lib/opportunity-hunt";
import { auditLeadEvidence } from "@/lib/lead-decision-engine";

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

describe("System-1 Decision Engine (auditLeadEvidence)", () => {
  it("passes high-confidence leads with third-party source and clear buyers", () => {
    const result = auditLeadEvidence(baseLead, [
      {
        id: "ev-1",
        leadId: baseLead.id,
        claim: "Government report highlights 35% plant outage due to manual inspection delays",
        sourceTitle: "National Safety Board",
        sourceUrl: "https://example.gov/safety-report.pdf",
        kind: "official",
        direction: "supports",
        observedAt: "2026-09-25",
      },
    ]);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.decision).toBe("Pass");
    expect(result.flags.length).toBe(0);
  });

  it("flags leads with founder-supplied unverified signals", () => {
    const founderLead: Lead = {
      ...baseLead,
      source: "Founder-supplied observation",
    };
    const result = auditLeadEvidence(founderLead, []);
    expect(result.flags).toContain("Unverified / founder-supplied source claim");
    expect(result.decision).not.toBe("Pass");
  });

  it("applies penalty and flags contradicting evidence", () => {
    const result = auditLeadEvidence(baseLead, [
      {
        id: "ev-contradict",
        leadId: baseLead.id,
        claim: "Target plants state they already automated this via existing DCS SCADA systems",
        sourceTitle: "Field interview with 3 plants",
        sourceUrl: "",
        kind: "buyer",
        direction: "contradicts",
        observedAt: "2026-09-25",
      },
    ]);

    expect(result.flags.some((f) => f.includes("contradicting"))).toBe(true);
    expect(result.decision).toBe("Flagged");
  });
});
