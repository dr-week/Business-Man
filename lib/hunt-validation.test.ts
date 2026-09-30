import { describe, it, expect } from "vitest";
import { leadInput, leadPatch, evidenceInput } from "@/lib/hunt-validation";

describe("Hunt Validation Schemas", () => {
  it("validates a complete, valid lead input", () => {
    const input = {
      title: "Crop cold-chain IoT",
      lane: "Crop systems",
      failure: "Cold storage temperature spikes spoil high-value export berries.",
      buyer: "Commercial berry farms and aggregators",
      trigger: "Export quarantine rejection rates increased",
      source: "https://example.gov/export-data",
      alternatives: "Manual temperature logs on paper",
      payment: "500 USD per container shipment",
      nextTest: "Place 5 loggers in sample containers",
    };

    const parsed = leadInput.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects leads with too-short titles or failures", () => {
    const invalid = {
      title: "No",
      lane: "Crop systems",
      failure: "Short",
    };
    const parsed = leadInput.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("validates evidence input with correct date and direction", () => {
    const validEvidence = {
      claim: "Growers lost 18% of produce in transit during July heatwave",
      sourceTitle: "Agri Export Review 2026",
      sourceUrl: "https://example.com/report",
      kind: "official",
      direction: "supports",
      observedAt: "2026-07-15",
    };

    const parsed = evidenceInput.safeParse(validEvidence);
    expect(parsed.success).toBe(true);
  });

  it("rejects malformed evidence dates", () => {
    const invalidEvidence = {
      claim: "Valid claim statement",
      sourceTitle: "Source name",
      sourceUrl: "",
      kind: "buyer",
      direction: "supports",
      observedAt: "15-07-2026", // Invalid format, expected YYYY-MM-DD
    };

    const parsed = evidenceInput.safeParse(invalidEvidence);
    expect(parsed.success).toBe(false);
  });

  it("validates leadPatch partial updates", () => {
    const patch = {
      decision: "Investigate",
      payment: "Verified 2000 USD pilot budget",
    };
    const parsed = leadPatch.safeParse(patch);
    expect(parsed.success).toBe(true);
  });

  it("requires dated user evidence for a validation outcome", () => {
    expect(leadPatch.safeParse({ validationStatus: "paid_pilot", validationObservedAt: "2026-09-29", validationNote: "Buyer paid for a trial.", validationPaymentAmount: 2500, validationPaymentCurrency: "INR" }).success).toBe(true);
    expect(leadPatch.safeParse({ validationStatus: "paid_pilot", validationObservedAt: "2026-09-29", validationNote: "Buyer said they paid." }).success).toBe(false);
    expect(leadPatch.safeParse({ validationStatus: "paid_pilot" }).success).toBe(false);
    expect(leadPatch.safeParse({ validationStatus: "stopped", validationObservedAt: "2026-99-99", validationNote: "No buyer need." }).success).toBe(false);
    expect(leadPatch.safeParse({ validationStatus: "repeat_purchase", validationObservedAt: "2026-09-29", validationSourceUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});
