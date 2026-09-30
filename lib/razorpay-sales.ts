import { z } from "zod";

export const saleOffer = z.enum(["decision_brief", "assisted_validation"]);
export type SaleOffer = z.infer<typeof saleOffer>;

const paidLinkEvent = z.object({
  event: z.string(),
  payload: z.object({
    payment_link: z.object({ entity: z.object({
      id: z.string().min(1).max(100),
      amount_paid: z.number().int().positive(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      notes: z.object({ businessman_sale_id: z.string().uuid() }).passthrough(),
    }).passthrough() }),
  }).passthrough(),
}).passthrough();

export function parsePaidLinkEvent(value: unknown) {
  const parsed = paidLinkEvent.safeParse(value);
  return parsed.success && parsed.data.event === "payment_link.paid" ? parsed.data : null;
}

export async function verifyRazorpayWebhook(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !/^[\da-f]{64}$/i.test(signature) || !secret) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  let mismatch = 0;
  for (let index = 0; index < digest.length; index++) mismatch |= digest[index] ^ Number.parseInt(signature.slice(index * 2, index * 2 + 2), 16);
  return mismatch === 0;
}
