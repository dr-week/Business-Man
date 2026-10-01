import { describe, expect, it } from "vitest";
import { researchResultSummary } from "./research-result-summary";

describe("research result summary", () => {
  it("does not label unscored forum leads as qualified", () => {
    expect(researchResultSummary([{ strength: null }, { strength: null }])).toBe("2 source leads; 0 with enough evidence to score");
  });
  it("counts only fully scored leads", () => {
    expect(researchResultSummary([{ strength: 65 }, { strength: null }])).toBe("2 source leads; 1 with enough evidence to score");
  });
  it("distinguishes web-only and empty results", () => {
    expect(researchResultSummary([], 1)).toBe("1 web source ready to review; no scored leads");
    expect(researchResultSummary([])).toContain("No relevant source leads");
  });
});
