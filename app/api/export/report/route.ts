import { NextRequest, NextResponse } from "next/server";
import { licenseGuard } from "@/lib/licenseGuard";
import { getDb } from "@/db";
import { researchBounties } from "@/db/schema";
/**
 * Export a detailed PDF report for a bounty (premium feature).
 * The request must include a valid premium license token in the Authorization header.
 */
export async function GET(request: Request) {
  const req = request as NextRequest;
  // License protection
  const guardResult = await licenseGuard(req);
  if (guardResult) return guardResult; // 401/403 if not authorized

  const url = new URL(req.url);
  const bountyId = url.searchParams.get("bountyId");
  if (!bountyId) {
    return NextResponse.json({ error: "bountyId query param required" }, { status: 400 });
  }

  const db = getDb();
  const [bounty] = await db.select().from(researchBounties).where(eq(researchBounties.id, bountyId)).limit(1);
  if (!bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  // Placeholder PDF generation – in reality you would integrate a PDF library.
  const pdfContent = `Report for Bounty ${bounty.id}\nOpportunity: ${bounty.opportunityName}\nReward: ${bounty.rewardAmount} ${bounty.currency}\nStatus: ${bounty.status}`;
  const buffer = Buffer.from(pdfContent, "utf-8");
  const base64 = buffer.toString("base64");

  return new NextResponse(base64, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bounty-${bounty.id}.pdf"`,
    },
  });
}
