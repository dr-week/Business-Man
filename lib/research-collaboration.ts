import type { ResearchOpportunity } from "@/lib/research-engine";

export type ContributionVerdict = "disconfirms" | "confirms" | "warns";
export type EvidenceType = "counter_pricing" | "local_supplier" | "regulation" | "pilot_refusal" | "customer_quote";
export type ContributorRole = "local_operator" | "field_researcher" | "angel_analyst" | "customer";

export interface ResearchContribution {
  id: string;
  bountyId?: string;
  opportunityId: string;
  contributorHandle: string;
  contributorRole: ContributorRole;
  evidenceType: EvidenceType;
  claimSummary: string;
  verdict: ContributionVerdict;
  sourceUrl?: string;
  verificationData?: Record<string, unknown>;
  status: "submitted" | "peer_verified" | "rejected" | "bounty_awarded";
  bountyAwarded?: number;
  createdAt: string;
}

export interface ResearchBounty {
  id: string;
  opportunityId: string;
  opportunityName: string;
  falsificationTarget: string;
  rewardAmount: number;
  currency: string;
  sponsorId: string;
  status: "open" | "in_review" | "verified" | "expired";
  contributionsCount: number;
  verifiedContributionId?: string;
  createdAt: string;
}

/**
 * Calculates credibility score and validation adjustment for an opportunity based on community contributions.
 */
export function calculateCommunityReputationImpact(
  baseStrength: number,
  contributions: ResearchContribution[]
): {
  adjustedStrength: number;
  disconfirmCount: number;
  confirmCount: number;
  warningCount: number;
  consensus: "strongly_disproven" | "partially_disproven" | "community_validated" | "needs_investigation";
  reputationDelta: number;
} {
  const verified = contributions.filter((c) => c.status === "peer_verified" || c.status === "bounty_awarded");

  let disconfirmCount = 0;
  let confirmCount = 0;
  let warningCount = 0;

  for (const c of verified) {
    if (c.verdict === "disconfirms") disconfirmCount++;
    else if (c.verdict === "confirms") confirmCount++;
    else if (c.verdict === "warns") warningCount++;
  }

  // Heavy penalty for disconfirming field evidence (negative research focus)
  const penalty = disconfirmCount * 22;
  const warningPenalty = warningCount * 8;
  const boost = confirmCount * 12;

  const reputationDelta = boost - penalty - warningPenalty;
  const adjustedStrength = Math.max(0, Math.min(100, baseStrength + reputationDelta));

  let consensus: "strongly_disproven" | "partially_disproven" | "community_validated" | "needs_investigation" = "needs_investigation";
  if (disconfirmCount >= 2) {
    consensus = "strongly_disproven";
  } else if (disconfirmCount === 1) {
    consensus = "partially_disproven";
  } else if (confirmCount >= 2 && disconfirmCount === 0) {
    consensus = "community_validated";
  }

  return {
    adjustedStrength,
    disconfirmCount,
    confirmCount,
    warningCount,
    consensus,
    reputationDelta,
  };
}

/**
 * Creates a default falsification bounty from an opportunity's identified gaps or risks.
 */
export function createDefaultBountyFromOpportunity(
  opportunity: ResearchOpportunity,
  sponsorId = "Businessman DAO",
  rewardAmount = 5000,
  currency = "INR"
): ResearchBounty {
  const target = opportunity.gap || (opportunity.risks && opportunity.risks[0]) || `Disprove local pricing power for ${opportunity.name}`;
  return {
    id: `bounty-${opportunity.id}-${Date.now().toString(36)}`,
    opportunityId: opportunity.id,
    opportunityName: opportunity.name,
    falsificationTarget: target,
    rewardAmount,
    currency,
    sponsorId,
    status: "open",
    contributionsCount: 0,
    createdAt: new Date().toISOString(),
  };
}
