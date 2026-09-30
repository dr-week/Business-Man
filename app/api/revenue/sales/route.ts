import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { productRevenue } from "@/db/schema";
import { apiError, isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { readLimitedJson } from "@/lib/read-limited-json";

const fulfillmentRequest = z.object({ saleId: z.string().uuid() }).strict();

export async function GET() {
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to view sales." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const sales = await getDb().select({
      id: productRevenue.id,
      offerId: productRevenue.offerId,
      paymentLinkId: productRevenue.paymentLinkId,
      amountMinor: productRevenue.amountMinor,
      paidAmountMinor: productRevenue.paidAmountMinor,
      currency: productRevenue.currency,
      status: productRevenue.status,
      createdAt: productRevenue.createdAt,
      paidAt: productRevenue.paidAt,
    }).from(productRevenue).where(eq(productRevenue.ownerId, owner))
      .orderBy(desc(productRevenue.createdAt)).limit(100);
    return Response.json({ sales }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to update sales." }, { status: 401 });
  let body: unknown;
  try { body = await readLimitedJson(request, 2048); }
  catch { return Response.json({ error: "Invalid fulfillment request." }, { status: 400 }); }
  const parsed = fulfillmentRequest.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Select a valid sale." }, { status: 400 });

  try {
    const db = getDb();
    const { saleId } = parsed.data;
    await db.update(productRevenue).set({ status: "fulfilled" })
      .where(and(eq(productRevenue.id, saleId), eq(productRevenue.ownerId, owner), eq(productRevenue.status, "paid")));
    const [sale] = await db.select({ status: productRevenue.status }).from(productRevenue)
      .where(and(eq(productRevenue.id, saleId), eq(productRevenue.ownerId, owner))).limit(1);
    if (!sale) return Response.json({ error: "Sale not found." }, { status: 404 });
    if (sale.status !== "fulfilled") return Response.json({ error: "Only captured payments can be marked fulfilled." }, { status: 409 });
    return Response.json({ saleId, status: sale.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
