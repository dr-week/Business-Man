import { describe, expect, it } from "vitest";
import { calculatePeerConsensus, type ResearchContribution } from "./peer-verification";

describe("peer verification consensus engine", () => {
  it("returns unverified consensus when no contributions exist", () => {
    const consensus = calculatePeerConsensus([]);
    expect(consensus.totalContributions).toBe(0);
    expect(consensus.peerConfidenceScore).toBeNull();
    expect(consensus.consensusVerdict).toBe("unverified");
  });

  it("calculates peer_supported consensus when confirmations outweigh disconfirmations", () => {
    const contributions: ResearchContribution[] = [
      {
        id: "contrib-1",
        opportunityId: "opp-123",
        contributorHandle: "rajesh_solar",
        contributorRole: "local_operator",
        evidenceType: "local_supplier",
        claimSummary: "Local fabrication partner quotes ₹1.1L for crawler chassis in Ahmedabad.",
        verdict: "confirms",
        sourceUrl: "https://example.com/quote",
        status: "peer_verified",
        bountyAwarded: 500,
        createdAt: "2026-09-30",
      },
      {
        id: "contrib-2",
        opportunityId: "opp-123",
        contributorHandle: "anil_field",
        contributorRole: "field_researcher",
        evidenceType: "unmet_workflow_demand",
        claimSummary: "Interviewed 3 solar farm managers in Bhadla; all 3 confirmed water shortage bottleneck.",
        verdict: "confirms",
        sourceUrl: null,
        status: "peer_verified",
        bountyAwarded: 1000,
        createdAt: "2026-09-30",
      },
    ];

    const consensus = calculatePeerConsensus(contributions);
    expect(consensus.totalContributions).toBe(2);
    expect(consensus.confirmsCount).toBe(2);
    expect(consensus.disconfirmsCount).toBe(0);
    expect(consensus.consensusVerdict).toBe("peer_supported");
    expect(consensus.peerConfidenceScore).toBe(80); // 50 + 30
  });

  it("calculates peer_challenged when disconfirming counter-evidence dominates", () => {
    const contributions: ResearchContribution[] = [
      {
        id: "contrib-1",
        opportunityId: "opp-123",
        contributorHandle: "priya_invest",
        contributorRole: "angel_analyst",
        evidenceType: "counter_pricing",
        claimSummary: "Chinese dry-cleaning robot imported at ₹85,000 via Mundra port completely undercuts local unit economics.",
        verdict: "disconfirms",
        sourceUrl: "https://indiamart.com/example",
        status: "peer_verified",
        bountyAwarded: 1500,
        createdAt: "2026-09-30",
      },
      {
        id: "contrib-2",
        opportunityId: "opp-123",
        contributorHandle: "dev_ops",
        contributorRole: "competitor_insider",
        evidenceType: "regulatory_hurdle",
        claimSummary: "MNRE certification process takes 14 months and costs ₹12L before pilots are permitted on grid-tied farms.",
        verdict: "disconfirms",
        sourceUrl: "https://mnre.gov.in/example",
        status: "peer_verified",
        bountyAwarded: 2000,
        createdAt: "2026-09-30",
      },
    ];

    const consensus = calculatePeerConsensus(contributions);
    expect(consensus.totalContributions).toBe(2);
    expect(consensus.disconfirmsCount).toBe(2);
    expect(consensus.consensusVerdict).toBe("peer_challenged");
    expect(consensus.peerConfidenceScore).toBe(10); // 50 - 40
  });

  it("flags high_friction when multiple warnings are raised", () => {
    const contributions: ResearchContribution[] = [
      {
        id: "contrib-1",
        opportunityId: "opp-456",
        contributorHandle: "legal_lens",
        contributorRole: "local_operator",
        evidenceType: "regulatory_hurdle",
        claimSummary: "State electricity board requires special clearance.",
        verdict: "warns",
        sourceUrl: null,
        status: "peer_verified",
        bountyAwarded: 0,
        createdAt: "2026-09-30",
      },
      {
        id: "contrib-2",
        opportunityId: "opp-456",
        contributorHandle: "buyer_rep",
        contributorRole: "prospective_buyer",
        evidenceType: "pilot_refusal",
        claimSummary: "Payment terms are 120-day credit cycle, requiring high working capital reserve.",
        verdict: "warns",
        sourceUrl: null,
        status: "submitted",
        bountyAwarded: 0,
        createdAt: "2026-09-30",
      },
    ];

    const consensus = calculatePeerConsensus(contributions);
    expect(consensus.consensusVerdict).toBe("high_friction");
    expect(consensus.warnsCount).toBe(2);
  });
});
