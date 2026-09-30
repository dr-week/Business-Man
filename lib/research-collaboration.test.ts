import { describe, expect, it } from "vitest";
import {
  calculateCommunityReputationImpact,
  createDefaultBountyFromOpportunity,
  type ResearchContribution,
} from "./research-collaboration";
import { blankFinancials, type ResearchOpportunity } from "./research-engine";

describe("research-collaboration", () => {
  it("creates a bounty from an opportunity risk or gap", () => {
    const opp: ResearchOpportunity = {
      id: "opp-solar",
      name: "Solar Robot",
      category: "CleanTech",
      geography: "India",
      buyer: "EPCs",
      problem: "Dust loses power",
      offering: "Waterless robot",
      alternatives: [],
      gap: "No local Indian robot under 1.5L",
      risks: ["Sandstorms jam track"],
      confidence: "High",
      strength: 80,
      financials: null,
      claims: [],
      assumptions: blankFinancials({ topic: "Solar Robot", geography: "India", budget: 150000, currency: "INR" }),
      factors: [],
      missing: [],
      sources: [],
    };

    const bounty = createDefaultBountyFromOpportunity(opp, "FoundersFund", 10000, "INR");
    expect(bounty.opportunityId).toBe("opp-solar");
    expect(bounty.falsificationTarget).toBe("No local Indian robot under 1.5L");
    expect(bounty.rewardAmount).toBe(10000);
    expect(bounty.currency).toBe("INR");
    expect(bounty.status).toBe("open");
  });

  it("penalizes opportunity score heavily when field disconfirming contributions arrive", () => {
    const contributions: ResearchContribution[] = [
      {
        id: "c1",
        opportunityId: "opp-solar",
        contributorHandle: "operator_raj",
        contributorRole: "local_operator",
        evidenceType: "local_supplier",
        claimSummary: "Local supplier in Ahmedabad already delivers equivalent robot for 90k INR with 2-yr warranty.",
        verdict: "disconfirms",
        status: "peer_verified",
        createdAt: new Date().toISOString(),
      },
      {
        id: "c2",
        opportunityId: "opp-solar",
        contributorHandle: "solar_epc_head",
        contributorRole: "customer",
        evidenceType: "pilot_refusal",
        claimSummary: "We tested dry cleaning robots in Jaisalmer; sand scratches glass coating within 3 months.",
        verdict: "disconfirms",
        status: "bounty_awarded",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = calculateCommunityReputationImpact(80, contributions);
    expect(result.disconfirmCount).toBe(2);
    expect(result.adjustedStrength).toBe(36); // 80 - (2 * 22) = 36
    expect(result.consensus).toBe("strongly_disproven");
  });

  it("boosts score when contributions confirm customer willingness to pay with no disconfirmations", () => {
    const contributions: ResearchContribution[] = [
      {
        id: "c1",
        opportunityId: "opp-solar",
        contributorHandle: "analyst_sharma",
        contributorRole: "angel_analyst",
        evidenceType: "customer_quote",
        claimSummary: "Confirmed 3 LOIs from EPC developers at 2.2L INR pricing.",
        verdict: "confirms",
        status: "peer_verified",
        createdAt: new Date().toISOString(),
      },
      {
        id: "c2",
        opportunityId: "opp-solar",
        contributorHandle: "field_guy",
        contributorRole: "field_researcher",
        evidenceType: "local_supplier",
        claimSummary: "Import tariffs on Chinese alternatives rose 20% this month.",
        verdict: "confirms",
        status: "bounty_awarded",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = calculateCommunityReputationImpact(70, contributions);
    expect(result.confirmCount).toBe(2);
    expect(result.disconfirmCount).toBe(0);
    expect(result.adjustedStrength).toBe(94); // 70 + (2 * 12) = 94
    expect(result.consensus).toBe("community_validated");
  });
});
