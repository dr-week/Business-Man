import { describe, expect, it } from "vitest";
import { buildValidationPlan } from "./validation-plan";

describe("validation plan", () => {
  it("maps missing evidence to a test and decision check", () => {
    const plan = buildValidationPlan(["Paid demand", "Local feasibility"]);
    expect(plan).toHaveLength(2);
    expect(plan[0].method).toContain("paid pilot");
    expect(plan[0].evidence).toContain("paid order");
    expect(plan[1].decision).toContain("available capital");
  });
  it("deduplicates repeated unknowns and gives unknown labels a safe fallback", () => {
    const plan = buildValidationPlan(["Named buyer", "Named buyer", "Unknown metric"]);
    expect(plan).toHaveLength(2);
    expect(plan[1].decision).toContain("unknown");
  });

  it("preserves priority so the first gap can be acted on first", () => {
    const plan = buildValidationPlan(["Verified paid demand", "Named buyer", "Local feasibility"]);
    expect(plan[0].missing).toBe("Verified paid demand");
    expect(plan.slice(1).map((action) => action.missing)).toEqual(["Named buyer", "Local feasibility"]);
  });

  it("trims blanks, bounds labels, and caps work to 20 unique actions", () => {
    const plan = buildValidationPlan(["  Named buyer  ", "", "   ", ...Array.from({ length: 30 }, (_, i) => `Question ${i}`)]);
    expect(plan).toHaveLength(20);
    expect(plan[0].missing).toBe("Named buyer");
    expect(plan.every((action) => action.missing.length <= 160)).toBe(true);
  });
});
