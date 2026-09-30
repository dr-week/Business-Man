import { z } from "zod";

export const bountyStatus = z.enum(["open", "in_review", "verified", "expired"]);
export type BountyStatus = z.infer<typeof bountyStatus>;

export const contributorRole = z.enum([
  "local_operator",
  "field_researcher",
  "angel_analyst",
  "customer",
]);
export type ContributorRole = z.infer<typeof contributorRole>;

export const evidenceType = z.enum([
  "counter_pricing",
  "local_supplier",
  "regulation",
  "pilot_refusal",
  "customer_quote",
]);
export type EvidenceType = z.infer<typeof evidenceType>;

export const contributionVerdict = z.enum(["disconfirms", "confirms", "warns"]);
export type ContributionVerdict = z.infer<typeof contributionVerdict>;

export const createBountySchema = z.object({
  opportunityId: z.string().trim().min(1).max(200),
  opportunityName: z.string().trim().min(2).max(200),
  falsificationTarget: z.string().trim().min(10).max(500),
  rewardAmount: z.number().int().min(0).max(500000).default(0),
  currency: z.string().trim().min(3).max(5).default("INR"),
  sponsorId: z.string().trim().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(90).default(14),
}).strict();

export type CreateBountyInput = z.infer<typeof createBountySchema>;

export const submitContributionSchema = z.object({
  bountyId: z.string().trim().min(1).max(100).optional(),
  opportunityId: z.string().trim().min(1).max(200),
  contributorHandle: z.string().trim().min(2).max(80).regex(/^@?[a-zA-Z0-9_-]+$/),
  contributorRole: contributorRole,
  evidenceType: evidenceType,
  claimSummary: z.string().trim().min(10).max(1000),
  verdict: contributionVerdict,
  sourceUrl: z.string().url().max(2000).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }).optional(),
  verificationData: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type SubmitContributionInput = z.infer<typeof submitContributionSchema>;

export interface PeerContributionItem {
  id: string;
  bountyId?: string | null;
  opportunityId: string;
  contributorHandle: string;
  contributorRole: ContributorRole;
  evidenceType: EvidenceType;
  claimSummary: string;
  verdict: ContributionVerdict;
  sourceUrl?: string | null;
  status: "submitted" | "peer_verified" | "rejected" | "bounty_awarded";
  bountyAwarded: number;
  createdAt: string;
}

export interface ResearchBountyItem {
  id: string;
  opportunityId: string;
  opportunityName: string;
  falsificationTarget: string;
  rewardAmount: number;
  currency: string;
  sponsorId: string;
  status: BountyStatus;
  verifiedBy?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  contributionsCount: number;
}

/**
 * Calculates platform split and payouts for peer-verified research bounties.
 * Platform retains a 15% verification escrow fee, paying 85% to the verified contributor.
 */
export function calculateBountySplit(rewardAmount: number): {
  contributorPayout: number;
  platformEscrowFee: number;
} {
  const safeReward = Math.max(0, Math.floor(rewardAmount));
  const platformEscrowFee = Math.round(safeReward * 0.15);
  const contributorPayout = safeReward - platformEscrowFee;
  return {
    contributorPayout,
    platformEscrowFee,
  };
}

/**
 * Derives consensus health and ground-truth confirmation score from peer contributions.
 */
export function evaluateConsensusSignals(contributions: PeerContributionItem[]): {
  confirmsCount: number;
  disconfirmsCount: number;
  warnsCount: number;
  consensusScore: number; // 0 to 100
  dominantVerdict: ContributionVerdict | "untested";
} {
  if (!contributions.length) {
    return {
      confirmsCount: 0,
      disconfirmsCount: 0,
      warnsCount: 0,
      consensusScore: 50,
      dominantVerdict: "untested",
    };
  }

  let confirms = 0;
  let disconfirms = 0;
  let warns = 0;

  for (const c of contributions) {
    if (c.verdict === "confirms") confirms++;
    else if (c.verdict === "disconfirms") disconfirms++;
    else if (c.verdict === "warns") warns++;
  }

  const total = confirms + disconfirms + warns;
  // Disconfirming counter-evidence reduces the score strongly to protect founders from false positives
  const rawScore = total > 0 ? Math.round(((confirms * 100) + (warns * 40)) / (total + (disconfirms * 1.5))) : 50;
  const consensusScore = Math.max(0, Math.min(100, rawScore));

  let dominantVerdict: ContributionVerdict | "untested" = "untested";
  if (disconfirms >= confirms && disconfirms >= warns) {
    dominantVerdict = "disconfirms";
  } else if (confirms >= disconfirms && confirms >= warns) {
    dominantVerdict = "confirms";
  } else if (warns > 0) {
    dominantVerdict = "warns";
  }

  return {
    confirmsCount: confirms,
    disconfirmsCount: disconfirms,
    warnsCount: warns,
    consensusScore,
    dominantVerdict,
  };
}
