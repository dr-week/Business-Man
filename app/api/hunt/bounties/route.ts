import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { researchBounties, researchContributions } from "@/db/schema";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import {
  createBountySchema,
  submitContributionSchema,
  evaluateConsensusSignals,
  type PeerContributionItem,
} from "@/lib/research-bounties";
import { readLimitedJson } from "@/lib/read-limited-json";

const sharedBountyFields = {
  id: researchBounties.id,
  opportunityId: researchBounties.opportunityId,
  opportunityName: researchBounties.opportunityName,
  falsificationTarget: researchBounties.falsificationTarget,
  rewardAmount: researchBounties.rewardAmount,
  currency: researchBounties.currency,
  status: researchBounties.status,
  createdAt: researchBounties.createdAt,
  expiresAt: researchBounties.expiresAt,
};

const sharedContributionFields = {
  id: researchContributions.id,
  bountyId: researchContributions.bountyId,
  opportunityId: researchContributions.opportunityId,
  contributorHandle: researchContributions.contributorHandle,
  contributorRole: researchContributions.contributorRole,
  evidenceType: researchContributions.evidenceType,
  claimSummary: researchContributions.claimSummary,
  verdict: researchContributions.verdict,
  sourceUrl: researchContributions.sourceUrl,
  status: researchContributions.status,
  createdAt: researchContributions.createdAt,
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const opportunityId = url.searchParams.get("opportunityId");
  const bountyId = url.searchParams.get("bountyId");

  try {
    const db = getDb();

    if (bountyId) {
      const [bounty] = await db.select(sharedBountyFields).from(researchBounties).where(eq(researchBounties.id, bountyId)).limit(1);
      if (!bounty) return Response.json({ error: "Bounty not found." }, { status: 404 });

      const contributions = await db.select(sharedContributionFields).from(researchContributions)
        .where(eq(researchContributions.bountyId, bountyId))
        .orderBy(desc(researchContributions.createdAt))
        .limit(50);

      const consensus = evaluateConsensusSignals(contributions as unknown as PeerContributionItem[]);

      return Response.json({
        bounty,
        contributions,
        consensus,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (opportunityId) {
      const bounties = await db.select(sharedBountyFields).from(researchBounties)
        .where(eq(researchBounties.opportunityId, opportunityId))
        .orderBy(desc(researchBounties.createdAt))
        .limit(20);

      const contributions = await db.select(sharedContributionFields).from(researchContributions)
        .where(eq(researchContributions.opportunityId, opportunityId))
        .orderBy(desc(researchContributions.createdAt))
        .limit(50);

      const consensus = evaluateConsensusSignals(contributions as unknown as PeerContributionItem[]);

      return Response.json({
        bounties,
        contributions,
        consensus,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    // Default: list recent active bounties
    const recentBounties = await db.select(sharedBountyFields).from(researchBounties)
      .orderBy(desc(researchBounties.createdAt))
      .limit(30);

    return Response.json({ bounties: recentBounties }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });

  let raw: unknown;
  try {
    raw = await readLimitedJson(request, 8192);
  } catch {
    return Response.json({ error: "Invalid or oversized payload." }, { status: 400 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "bounty";

  try {
    const db = getDb();

    if (action === "contribution") {
      const parsed = submitContributionSchema.safeParse(raw);
      if (!parsed.success) {
        return Response.json({ error: "Invalid contribution submission." }, { status: 400 });
      }

      if (parsed.data.bountyId) {
        const [bounty] = await db.select({
          opportunityId: researchBounties.opportunityId,
          status: researchBounties.status,
          expiresAt: researchBounties.expiresAt,
        }).from(researchBounties).where(eq(researchBounties.id, parsed.data.bountyId)).limit(1);
        const expired = bounty?.expiresAt ? Date.parse(bounty.expiresAt) <= Date.now() : false;
        if (!bounty || bounty.opportunityId !== parsed.data.opportunityId || bounty.status !== "open" || expired) {
          return Response.json({ error: "This bounty is unavailable for the selected opportunity." }, { status: 400 });
        }
      }

      const id = crypto.randomUUID();
      const [contribution] = await db.insert(researchContributions).values({
        id,
        bountyId: parsed.data.bountyId ?? null,
        opportunityId: parsed.data.opportunityId,
        contributorHandle: parsed.data.contributorHandle,
        contributorRole: parsed.data.contributorRole,
        evidenceType: parsed.data.evidenceType,
        claimSummary: parsed.data.claimSummary,
        verdict: parsed.data.verdict,
        sourceUrl: parsed.data.sourceUrl ?? null,
        verificationData: parsed.data.verificationData ? JSON.stringify(parsed.data.verificationData) : null,
        status: "submitted",
        bountyAwarded: 0,
      }).returning();

      return Response.json({ contribution }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    // Action: create bounty
    const parsed = createBountySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "Invalid bounty parameters." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 86400000).toISOString();

    const [bounty] = await db.insert(researchBounties).values({
      id,
      opportunityId: parsed.data.opportunityId,
      opportunityName: parsed.data.opportunityName,
      falsificationTarget: parsed.data.falsificationTarget,
      rewardAmount: parsed.data.rewardAmount,
      currency: parsed.data.currency,
      sponsorId: owner,
      status: "open",
      expiresAt,
    }).returning();

    return Response.json({ bounty }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
