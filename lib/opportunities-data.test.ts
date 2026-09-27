import { describe, it, expect } from "vitest";
import { opportunities } from "@/lib/opportunities-data";

describe("Opportunities Seed Data", () => {
  it("contains unique IDs across all opportunity items", () => {
    const ids = opportunities.map((o) => o.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("contains valid stages and non-empty nextTest for each item", () => {
    for (const opp of opportunities) {
      expect(["Signal", "Watch", "Validate"]).toContain(opp.stage);
      expect(opp.name.trim().length).toBeGreaterThan(0);
      expect(opp.nextTest.trim().length).toBeGreaterThan(0);
      expect(opp.thesis.trim().length).toBeGreaterThan(0);
    }
  });

  it("ensures each opportunity has at least one evidence item", () => {
    for (const opp of opportunities) {
      expect(opp.evidence.length).toBeGreaterThanOrEqual(1);
      for (const ev of opp.evidence) {
        expect(ev.claim.trim().length).toBeGreaterThan(0);
        expect(ev.source.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("ensures risks have concrete mitigations if provided", () => {
    for (const opp of opportunities) {
      if (opp.risks) {
        for (const risk of opp.risks) {
          expect(risk.risk.trim().length).toBeGreaterThan(0);
          expect(risk.mitigation.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
