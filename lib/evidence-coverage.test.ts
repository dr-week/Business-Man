import { describe, expect, it } from "vitest";
import { summarizeEvidence } from "./evidence-coverage";

const item = (url: string, risk = false) => ({ claim: "Claim", source: "Source", url, risk });

describe("summarizeEvidence", () => {
  it("starts with traceable research and a buyer interview when empty", () => {
    expect(summarizeEvidence([], "Fallback")).toMatchObject({
      total: 0,
      linked: 0,
      sourceDomains: 0,
      openQuestions: 0,
      nextAction: "Gather one traceable market signal and one buyer interview.",
    });
  });

  it("asks to verify claims without HTTPS source links first", () => {
    const result = summarizeEvidence([item("http://example.com"), item("#", true)], "Fallback");
    expect(result.linked).toBe(0);
    expect(result.openQuestions).toBe(1);
    expect(result.nextAction).toBe("Verify unlinked claims and attach their original sources.");
  });

  it("asks for buyer testing when evidence contains only open questions", () => {
    const result = summarizeEvidence([item("https://example.com", true)], "Fallback");
    expect(result.nextAction).toBe("Test the buyer problem with direct interviews or a paid pilot.");
  });

  it("prioritizes open questions before cross-checking one source domain", () => {
    const result = summarizeEvidence([item("https://www.example.com"), item("https://example.com/question", true)], "Fallback");
    expect(result.sourceDomains).toBe(1);
    expect(result.nextAction).toBe("Resolve the highest-impact open question with a buyer or field test.");
  });

  it("cross-checks a single domain and uses fallback after independent domains", () => {
    expect(summarizeEvidence([item("https://www.example.com/a")], "Fallback").nextAction)
      .toBe("Cross-check the strongest claim with an independent source.");
    expect(summarizeEvidence([item("https://example.com"), item("https://other.test")], "Fallback").nextAction)
      .toBe("Fallback");
  });
});
