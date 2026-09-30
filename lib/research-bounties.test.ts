import { describe, expect, it } from "vitest";
import {
  createBountySchema,
  collaborationBountyRecordSchema,
  submitContributionSchema,
  calculateBountySplit,
  evaluateConsensusSignals,
  type PeerContributionItem,
} from "./research-bounties";

describe("research-bounties", () => {
  describe("schemas", () => {
    it("validates valid bounty creation input", () => {
      const input = {
        opportunityId: "opp-solar-robot",
        opportunityName: "Solar Panel Dry Cleaning Robot",
        falsificationTarget: "Verify if local solar farms in Bhadla pay > ₹15/panel for water cleaning",
        rewardAmount: 5000,
        currency: "INR",
        expiresInDays: 14,
      };
      const parsed = createBountySchema.parse(input);
      expect(parsed.rewardAmount).toBe(5000);
      expect(parsed.opportunityId).toBe("opp-solar-robot");
      expect(createBountySchema.safeParse({ ...input, sponsorId: "spoofed" }).success).toBe(false);
    });

    it("rejects invalid URL in peer contribution", () => {
      const input = {
        opportunityId: "opp-solar-robot",
        contributorHandle: "@rohit_field_ops",
        contributorRole: "local_operator",
        evidenceType: "counter_pricing",
        claimSummary: "Spoke to Bhadla site manager: current contract is ₹8/panel, not ₹15.",
        verdict: "disconfirms",
        sourceUrl: "http://insecure-site.com", // must be https
      };
      expect(() => submitContributionSchema.parse(input)).toThrow();
    });

    it("keeps sponsor account identifiers out of the shared bounty view", () => {
      const bounty = collaborationBountyRecordSchema.parse({
        id: "bounty-1",
        opportunityId: "opp-1",
        opportunityName: "Local service",
        falsificationTarget: "Verify the quoted supplier price",
        rewardAmount: 1000,
        currency: "INR",
        sponsorId: "private-account-id",
        status: "open",
        createdAt: "2026-09-30T00:00:00.000Z",
        expiresAt: null,
      });
      expect(bounty).not.toHaveProperty("sponsorId");
    });

    it("accepts valid peer contribution with valid https URL", () => {
      const input = {
        opportunityId: "opp-solar-robot",
        contributorHandle: "@rohit_field_ops",
        contributorRole: "local_operator",
        evidenceType: "counter_pricing",
        claimSummary: "Spoke to Bhadla site manager: current contract is ₹8/panel, not ₹15.",
        verdict: "disconfirms",
        sourceUrl: "https://tender-portal.rajasthan.gov.in/solar-maintenance-2026",
      };
      const parsed = submitContributionSchema.parse(input);
      expect(parsed.verdict).toBe("disconfirms");
      expect(parsed.contributorHandle).toBe("@rohit_field_ops");
    });
  });

  describe("calculateBountySplit", () => {
    it("allocates 85% to contributor and 15% platform escrow fee", () => {
      const split = calculateBountySplit(10000);
      expect(split.contributorPayout).toBe(8500);
      expect(split.platformEscrowFee).toBe(1500);
    });

    it("handles zero reward gracefully", () => {
      const split = calculateBountySplit(0);
      expect(split.contributorPayout).toBe(0);
      expect(split.platformEscrowFee).toBe(0);
    });
  });

  describe("evaluateConsensusSignals", () => {
    it("returns default untested values when no contributions exist", () => {
      const consensus = evaluateConsensusSignals([]);
      expect(consensus.confirmsCount).toBe(0);
      expect(consensus.disconfirmsCount).toBe(0);
      expect(consensus.dominantVerdict).toBe("untested");
      expect(consensus.consensusScore).toBe(50);
    });

    it("does not count pending submissions as consensus evidence", () => {
      const pending: PeerContributionItem[] = [{
        id: "pending-1",
        opportunityId: "opp-1",
        contributorHandle: "@new_user",
        contributorRole: "customer",
        evidenceType: "customer_quote",
        claimSummary: "A pending claim has not been reviewed yet.",
        verdict: "confirms",
        status: "submitted",
        bountyAwarded: 0,
        createdAt: "2026-09-30T00:00:00.000Z",
      }];
      const consensus = evaluateConsensusSignals(pending);
      expect(consensus.confirmsCount).toBe(0);
      expect(consensus.disconfirmsCount).toBe(0);
      expect(consensus.dominantVerdict).toBe("untested");
    });

    it("penalizes consensus score heavily when disconfirming evidence is submitted", () => {
      const contributions: PeerContributionItem[] = [
        {
          id: "c-1",
          opportunityId: "opp-1",
          contributorHandle: "@analyst1",
          contributorRole: "local_operator",
          evidenceType: "counter_pricing",
          claimSummary: "Unit economics fail at local distributor prices",
          verdict: "disconfirms",
          status: "peer_verified",
          bountyAwarded: 0,
          createdAt: "2026-09-30",
        },
        {
          id: "c-2",
          opportunityId: "opp-1",
          contributorHandle: "@analyst2",
          contributorRole: "field_researcher",
          evidenceType: "pilot_refusal",
          claimSummary: "2 buyers stated they have 3-year lock-in with existing vendor",
          verdict: "disconfirms",
          status: "peer_verified",
          bountyAwarded: 0,
          createdAt: "2026-09-30",
        },
        {
          id: "c-3",
          opportunityId: "opp-1",
          contributorHandle: "@analyst3",
          contributorRole: "customer",
          evidenceType: "customer_quote",
          claimSummary: "Would buy if price is 20% lower",
          verdict: "confirms",
          status: "peer_verified",
          bountyAwarded: 0,
          createdAt: "2026-09-30",
        },
      ];

      const consensus = evaluateConsensusSignals(contributions);
      expect(consensus.disconfirmsCount).toBe(2);
      expect(consensus.confirmsCount).toBe(1);
      expect(consensus.dominantVerdict).toBe("disconfirms");
      expect(consensus.consensusScore).toBeLessThan(30);
    });
  });
});
