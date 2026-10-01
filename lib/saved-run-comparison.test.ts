import { describe, expect, it } from "vitest";
import { compareSavedRuns, parseComparableRun, type ComparableRun } from "@/lib/saved-run-comparison";

const snapshot = (createdAt: string, opportunities: ComparableRun["opportunities"]): ComparableRun => ({
  topic: "Cold storage demand", geography: "Goa, India", currency: "INR", createdAt, opportunities,
});

describe("compareSavedRuns", () => {
  it("reports changed scores, confidence, evidence counts, additions, and removals", () => {
    const result = compareSavedRuns(
      snapshot("2026-08-01T00:00:00.000Z", [
        { id: "cold-chain", name: "Cold chain", strength: 48, confidence: "Low", sources: [{ id: "a" }] },
        { id: "ice", name: "Ice supply", strength: null, confidence: "Low", sources: [] },
        { id: "old-service", name: "Old service", strength: 20, confidence: "Low", sources: [] },
      ]),
      snapshot("2026-09-01T00:00:00.000Z", [
        { id: "cold-chain", name: "Cold chain", strength: 66, confidence: "Medium", sources: [{ id: "a" }, { id: "b" }] },
        { id: "ice", name: "Ice supply", strength: null, confidence: "Low", sources: [] },
        { id: "warehouse", name: "Warehouse services", strength: 52, confidence: "Low", sources: [] },
      ]),
    );

    expect(result.matched[0]).toMatchObject({ strengthChange: 18, previousConfidence: "Low", currentConfidence: "Medium", previousSources: 1, currentSources: 2 });
    expect(result.matched[1].strengthChange).toBeNull();
    expect(result.added).toEqual(["Warehouse services"]);
    expect(result.removed).toEqual(["Old service"]);
  });

  it("rejects comparisons across different research scopes", () => {
    expect(() => compareSavedRuns(
      snapshot("2026-08-01T00:00:00.000Z", []),
      { ...snapshot("2026-09-01T00:00:00.000Z", []), geography: "Pune, India" },
    )).toThrow("Saved runs must have the same topic, location, and currency.");
  });

  it("parses saved API snapshots and rejects malformed payloads", () => {
    const run = snapshot("2026-09-01T00:00:00.000Z", [{ id: "one", name: "Cold chain", strength: 60, confidence: "Medium", sources: [{ id: "source" }] }]);
    expect(parseComparableRun({ ...run, result: { opportunities: run.opportunities } }).opportunities).toHaveLength(1);
    expect(() => parseComparableRun({ ...run, result: { opportunities: [{ ...run.opportunities[0], strength: "high" }] } })).toThrow("A saved run has an unsupported format.");
  });
});
