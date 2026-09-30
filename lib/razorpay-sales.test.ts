import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parsePaidLinkEvent, verifyRazorpayWebhook } from "./razorpay-sales";

describe("Razorpay sales hooks", () => {
  it("verifies the exact raw request body", async () => {
    const raw = '{"event":"ignored"}';
    const signature = createHmac("sha256", "webhook-secret").update(raw).digest("hex");
    expect(await verifyRazorpayWebhook(raw, signature, "webhook-secret")).toBe(true);
    expect(await verifyRazorpayWebhook(raw + " ", signature, "webhook-secret")).toBe(false);
    expect(await verifyRazorpayWebhook(raw, null, "webhook-secret")).toBe(false);
  });

  it("accepts only a valid paid link with sale ownership metadata", () => {
    const event = { event: "payment_link.paid", payload: { payment_link: { entity: {
      id: "plink_123", amount_paid: 79900, currency: "INR",
      notes: { businessman_sale_id: "ad01919c-e7c9-4e0c-9f38-3d5f6b4d2d8e", owner_id: "owner-1" },
    } } } };
    expect(parsePaidLinkEvent(event)?.payload.payment_link.entity.amount_paid).toBe(79900);
    expect(parsePaidLinkEvent({ ...event, event: "payment_link.expired" })).toBeNull();
    expect(parsePaidLinkEvent({ ...event, payload: { payment_link: { entity: { ...event.payload.payment_link.entity, amount_paid: -1 } } } })).toBeNull();
  });
});
