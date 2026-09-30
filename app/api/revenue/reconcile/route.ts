import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { getDb } from "@/db";
import { productRevenue } from "@/db/schema";
import { isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { readLimitedJson } from "@/lib/read-limited-json";
import { parseReconciledPaidLink } from "@/lib/razorpay-sales";

const requestSchema = z.object({ saleId: z.string().uuid() }).strict();

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to check payment status." }, { status: 401 });
  let body: unknown;
  try { body = await readLimitedJson(request, 2048); }
  catch { return Response.json({ error: "Invalid payment check request." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Select a valid sale." }, { status: 400 });
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return Response.json({ error: "Payment status check is not configured." }, { status: 503 });
  }

  try {
    const db = getDb();
    const [sale] = await db.select({
      id: productRevenue.id,
      ownerId: productRevenue.ownerId,
      paymentLinkId: productRevenue.paymentLinkId,
      amountMinor: productRevenue.amountMinor,
      currency: productRevenue.currency,
      status: productRevenue.status,
    }).from(productRevenue).where(and(
      eq(productRevenue.id, parsed.data.saleId), eq(productRevenue.ownerId, owner),
    )).limit(1);
    if (!sale) return Response.json({ error: "Sale not found." }, { status: 404 });
    if (sale.status === "paid" || sale.status === "fulfilled") {
      return Response.json({ saleId: sale.id, status: sale.status }, { headers: { "Cache-Control": "no-store" } });
    }
    if (sale.status !== "link_created" || sale.paymentLinkId.startsWith("pending_")) {
      return Response.json({ error: "This sale has no usable payment link to check." }, { status: 409 });
    }

    const response = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(sale.paymentLinkId)}`, {
      headers: { Authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}` },
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!response.ok) return Response.json({ error: "Payment provider status check failed." }, { status: 502 });
    let snapshot: unknown;
    try { snapshot = await readLimitedJson(response, 16_384); }
    catch { return Response.json({ error: "Payment provider returned an invalid status." }, { status: 502 }); }

    const link = parseReconciledPaidLink(snapshot, {
      id: sale.paymentLinkId,
      saleId: sale.id,
      amountMinor: sale.amountMinor,
      currency: sale.currency,
    });
    if (!link) {
      return Response.json({ saleId: sale.id, status: "link_created", captured: false }, { headers: { "Cache-Control": "no-store" } });
    }

    await db.update(productRevenue).set({ status: "paid", paidAmountMinor: link.amount_paid })
      .where(and(eq(productRevenue.id, sale.id), eq(productRevenue.ownerId, owner), eq(productRevenue.status, "link_created")));
    const [current] = await db.select({ status: productRevenue.status }).from(productRevenue)
      .where(and(eq(productRevenue.id, sale.id), eq(productRevenue.ownerId, owner))).limit(1);
    return Response.json({ saleId: sale.id, status: current?.status ?? "link_created", captured: current?.status === "paid" || current?.status === "fulfilled" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Could not check payment status." }, { status: 500 });
  }
}
