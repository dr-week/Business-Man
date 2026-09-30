import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { licenseGuard } from "@/lib/licenseGuard";
import { getDb } from "@/db";
import { researchBounties } from "@/db/schema";
import { createBountyReportPdf } from "@/lib/bounty-report";
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

  const pdf = await createBountyReportPdf(bounty);
  const safeId = bounty.id.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bounty-${safeId}.pdf"`,
    },
  });
}
