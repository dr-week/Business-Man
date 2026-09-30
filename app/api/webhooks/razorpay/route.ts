import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { productRevenue } from "@/db/schema";
import { parsePaidLinkEvent, verifyRazorpayWebhook } from "@/lib/razorpay-sales";

const MAX_BODY_BYTES = 128 * 1024;

async function readRawBody(request: Request): Promise<string | null> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) return null;
      chunks.push(value);
    }
  } catch { return null; }
  finally { await reader.cancel().catch(() => {}); }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch { return null; }
}

export async function POST(request: Request) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  const raw = await readRawBody(request);
  if (raw == null) return Response.json({ error: "Invalid webhook body." }, { status: 400 });
  if (!await verifyRazorpayWebhook(raw, request.headers.get("x-razorpay-signature"), env.RAZORPAY_WEBHOOK_SECRET)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }
  let body: unknown;
  try { body = JSON.parse(raw); }
  catch { return Response.json({ error: "Invalid webhook JSON." }, { status: 400 }); }
  const event = parsePaidLinkEvent(body);
  if (!event) {
    const name = body && typeof body === "object" && "event" in body ? body.event : null;
    return typeof name === "string" && name !== "payment_link.paid"
      ? Response.json({ received: true })
      : Response.json({ error: "Invalid paid-link event." }, { status: 400 });
  }

  const link = event.payload.payment_link.entity;
  try {
    const db = getDb();
    const [sale] = await db.select().from(productRevenue).where(eq(productRevenue.id, link.notes.businessman_sale_id)).limit(1);
    if (!sale || sale.paymentLinkId !== link.id || sale.currency !== link.currency || sale.amountMinor !== link.amount_paid) {
      return Response.json({ error: "Payment does not match a known sale." }, { status: 400 });
    }
    if (sale.status !== "paid") {
      await db.update(productRevenue).set({ status: "paid", paidAmountMinor: link.amount_paid, paidAt: new Date().toISOString() }).where(eq(productRevenue.id, sale.id));
    }
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Could not record payment event." }, { status: 503 });
  }
}
