import { describe, expect, it } from "vitest";
import { summarizeValidationOutcomes } from "./validation-summary";
import type { Lead } from "./opportunity-hunt";

const lead = (id: string, values: Partial<Lead>): Lead => ({
  id, title: id, lane: "Workflow failure", failure: "A repeated buyer problem", buyer: "Retailers", trigger: "", source: "", alternatives: "", payment: "", nextTest: "", createdAt: "2026-09-30", ...values,
});

describe("saved validation summary", () => {
  it("counts offers and paid outcomes and keeps currencies separate", () => {
    const summary = summarizeValidationOutcomes([
      lead("offered", { validationStatus: "pilot_offered" }),
      lead("inr", { validationStatus: "paid_pilot", validationPaymentAmount: 2500, validationPaymentCurrency: "INR" }),
      lead("repeat", { validationStatus: "repeat_purchase", validationPaymentAmount: 25, validationPaymentCurrency: "USD" }),
      lead("missing-amount", { validationStatus: "paid_pilot" }),
    ]);

    expect(summary).toEqual({
      pilotsOffered: 1,
      paidSignals: 2,
      repeatPurchases: 1,
      paymentsByCurrency: [{ currency: "INR", amount: 2500 }, { currency: "USD", amount: 25 }],
    });
  });
});
