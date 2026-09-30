import { z } from "zod";

export const bountyStatus = z.enum(["open", "in_review", "verified", "expired"]);
export type BountyStatus = z.infer<typeof bountyStatus>;

export const contributorRole = z.enum([
  "local_operator",
  "field_researcher",
  "angel_analyst",
  "prospective_buyer",
  "competitor_insider",
]);
export type ContributorRole = z.infer<typeof contributorRole>;

export const contributionEvidenceType = z.enum([
  "counter_pricing",
  "local_supplier",
  "regulatory_hurdle",
  "pilot_refusal",
  "unmet_workflow_demand",
]);
export type ContributionEvidenceType = z.infer<typeof contributionEvidenceType>;

export const contributionVerdict = z.enum(["confirms", "disconfirms", "warns"]);
export type ContributionVerdict = z.infer<typeof contributionVerdict>;

export const contributionStatus = z.enum(["submitted", "peer_verified", "rejected", "bounty_awarded"]);
export type ContributionStatus = z.infer<typeof contributionStatus>;

export const researchBountySchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  opportunityName: z.string().min(1),
  falsificationTarget: z.string().min(5),
  rewardAmount: z.number().int().min(0),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
  sponsorId: z.string().min(1),
  status: bountyStatus.default("open"),
  verifiedBy: z.string().nullable().optional(),
  createdAt: z.string(),
  expiresAt: z.string().nullable().optional(),
});
export type ResearchBounty = z.infer<typeof researchBountySchema>;

export const researchContributionSchema = z.object({
  id: z.string().min(1),
  bountyId: z.string().nullable().optional(),
  opportunityId: z.string().min(1),
  contributorHandle: z.string().min(2),
  contributorRole,
  evidenceType: contributionEvidenceType,
  claimSummary: z.string().min(10),
  verdict: contributionVerdict,
  sourceUrl: z.string().url().nullable().optional(),
  status: contributionStatus.default("submitted"),
  bountyAwarded: z.number().int().default(0),
  createdAt: z.string(),
});
export type ResearchContribution = z.infer<typeof researchContributionSchema>;

export interface PeerVerificationConsensus {
  opportunityId: string;
  totalContributions: number;
  confirmsCount: number;
  disconfirmsCount: number;
  warnsCount: number;
  peerConfidenceScore: number | null; // 0 to 100, null if no contributions
  consensusVerdict: "unverified" | "peer_supported" | "peer_challenged" | "high_friction";
}

export function calculatePeerConsensus(contributions: ResearchContribution[]): PeerVerificationConsensus {
  if (!contributions.length) {
    return {
      opportunityId: "",
      totalContributions: 0,
      confirmsCount: 0,
      disconfirmsCount: 0,
      warnsCount: 0,
      peerConfidenceScore: null,
      consensusVerdict: "unverified",
    };
  }

  const oppId = contributions[0].opportunityId;
  const confirms = contributions.filter((c) => c.verdict === "confirms").length;
  const disconfirms = contributions.filter((c) => c.verdict === "disconfirms").length;
  const warns = contributions.filter((c) => c.verdict === "warns").length;
  const total = contributions.length;

  // Confidence formula: Base 50, +15 per confirm, -20 per disconfirm, -10 per warning
  let rawScore = 50 + confirms * 15 - disconfirms * 20 - warns * 10;
  rawScore = Math.max(0, Math.min(100, rawScore));

  let consensusVerdict: PeerVerificationConsensus["consensusVerdict"] = "unverified";
  if (disconfirms > confirms) {
    consensusVerdict = "peer_challenged";
  } else if (warns >= 2 && warns >= confirms) {
    consensusVerdict = "high_friction";
  } else if (confirms > 0 && confirms >= disconfirms) {
    consensusVerdict = "peer_supported";
  }

  return {
    opportunityId: oppId,
    totalContributions: total,
    confirmsCount: confirms,
    disconfirmsCount: disconfirms,
    warnsCount: warns,
    peerConfidenceScore: rawScore,
    consensusVerdict,
  };
}
