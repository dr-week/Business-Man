import { describe, expect, it } from "vitest";
import { counterCheckInput, counterCheckOutcome, MAX_COUNTER_CHECKS_PER_OPPORTUNITY } from "./counter-evidence";

describe("counter-evidence input", () => {
  it("accepts one bounded, specific disconfirming question", () => {
    expect(counterCheckInput.parse({ opportunityId: "opp-1", question: "Would buyers reject this price?" })).toMatchObject({
      opportunityId: "opp-1", question: "Would buyers reject this price?",
    });
    expect(MAX_COUNTER_CHECKS_PER_OPPORTUNITY).toBe(20);
  });

  it("rejects blank, short, oversized, or extra fields", () => {
    expect(counterCheckInput.safeParse({ opportunityId: "x", question: "No?" }).success).toBe(false);
    expect(counterCheckInput.safeParse({ opportunityId: "x", question: "x".repeat(501) }).success).toBe(false);
    expect(counterCheckInput.safeParse({ opportunityId: "x", question: "Specific falsifier question", status: "done" }).success).toBe(false);
  });

  it("requires a classified, dated HTTPS source and explicit outcome", () => {
    const today = new Date().toISOString().slice(0, 10);
    const valid = { outcome: "disconfirms", evidenceKind: "user_report", note: "Three target buyers rejected the quoted price.", sourceTitle: "Buyer interviews", sourceUrl: "https://example.com/interviews", observedAt: today };
    expect(counterCheckOutcome.safeParse(valid).success).toBe(true);
    expect(counterCheckOutcome.safeParse({ ...valid, sourceUrl: "http://example.com" }).success).toBe(false);
    expect(counterCheckOutcome.safeParse({ ...valid, observedAt: "2026-02-30" }).success).toBe(false);
    expect(counterCheckOutcome.safeParse({ ...valid, observedAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) }).success).toBe(false);
    expect(counterCheckOutcome.safeParse({ ...valid, sourceTitle: "" }).success).toBe(false);
    expect(counterCheckOutcome.safeParse({ ...valid, evidenceKind: "unverified_fact" }).success).toBe(false);
    expect(counterCheckOutcome.safeParse({ ...valid, outcome: "auto_rejected" }).success).toBe(false);
  });
});
