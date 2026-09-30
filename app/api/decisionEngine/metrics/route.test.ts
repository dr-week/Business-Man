import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/hunt-api", () => ({ ownerId: vi.fn(async () => "test-owner"), isCrossOrigin: vi.fn(() => false) }));

import { POST } from "./route";

describe("decision metrics workflow", () => {
  it("keeps triage at investigate when paid-demand claim points to an unknown source", async () => {
    const response = await POST(new Request("http://localhost/api/decisionEngine/metrics", {
      method: "POST",
      body: JSON.stringify({ opportunities: [{
        id: "opportunity-1",
        buyer: "Independent retailers",
        gap: "No local supplier covers same-day restocking",
        financials: { contribution: 100, paybackMonth: 4, scenarios: [{ margin: 20 }, { margin: 60 }, { margin: 70 }] },
        claims: [{ direction: "supports", factor: "Paid demand", sourceIds: ["missing-source"] }],
        sources: [{ id: "source-1", provider: "Buyer interview" }],
      }] }),
    }));
    const body = await response.json() as { evaluations: { quickVerdict: string; missingEvidence: string[] }[] };

    expect(response.status).toBe(200);
    expect(body.evaluations[0].quickVerdict).toBe("pause_investigate");
    expect(body.evaluations[0].missingEvidence).toContain("Source-linked paid-demand evidence");
  });
});
