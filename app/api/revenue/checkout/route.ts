import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { getDb } from "@/db";
import { productRevenue } from "@/db/schema";
import { isCrossOrigin, ownerId } from "@/lib/hunt-api";
import { readLimitedJson } from "@/lib/read-limited-json";
import { saleOffer } from "@/lib/razorpay-sales";

const requestSchema = z.object({ offerId: saleOffer }).strict();

export async function POST(request: Request) {
  if (isCrossOrigin(request)) return Response.json({ error: "Cross-origin request denied." }, { status: 403 });
  const owner = await ownerId();
  if (!owner) return Response.json({ error: "Sign in to create a payment link." }, { status: 401 });
  let body: unknown;
  try { body = await readLimitedJson(request, 2048); }
  catch { return Response.json({ error: "Invalid checkout request." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Select a supported pilot offer." }, { status: 400 });
  const { offerId } = parsed.data;
  const offers = {
    decision_brief: { title: "Evidence Decision Brief", price: env.RAZORPAY_DECISION_BRIEF_PRICE_PAISE },
    assisted_validation: { title: "Assisted Field Validation Pilot", price: env.RAZORPAY_ASSISTED_VALIDATION_PRICE_PAISE },
  } as const;
  const offer = offers[offerId];
  const amount = Number(offer.price);
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000) {
    return Response.json({ error: "Checkout is not configured. Set Razorpay keys and an INR pilot price." }, { status: 503 });
  }

  const id = crypto.randomUUID();
  const db = getDb();
  let saved = false;
  try {
    await db.insert(productRevenue).values({ id, ownerId: owner, offerId, referenceId: id, paymentLinkId: `pending_${id}`, amountMinor: amount, currency: "INR", status: "creating" });
    saved = true;
    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount, currency: "INR", accept_partial: false, reference_id: id,
        description: offer.title, notify: { sms: false, email: false },
        expire_by: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        notes: { businessman_sale_id: id, offer_id: offerId },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Payment provider rejected checkout creation.");
    const result = z.object({ id: z.string().min(1).max(100), short_url: z.string().url() }).safeParse(await readLimitedJson(response, 16_384));
    const paymentUrl = result.success ? new URL(result.data.short_url) : null;
    if (!result.success || paymentUrl?.protocol !== "https:" || paymentUrl.hostname !== "rzp.io") throw new Error("Payment provider returned an invalid link.");
    await db.update(productRevenue).set({ paymentLinkId: result.data.id, status: "link_created" }).where(and(eq(productRevenue.id, id), eq(productRevenue.ownerId, owner)));
    return Response.json({ url: result.data.short_url, amountMinor: amount, currency: "INR", offerId }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    if (saved) {
      try { await db.update(productRevenue).set({ status: "failed" }).where(and(eq(productRevenue.id, id), eq(productRevenue.ownerId, owner))); }
      catch { /* Keep the provider failure response generic; the recorded row can be reconciled. */ }
    }
    return Response.json({ error: "Could not create the payment link. Check provider configuration and retry." }, { status: 502 });
  }
}
