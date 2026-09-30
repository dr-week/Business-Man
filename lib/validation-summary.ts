import type { Lead } from "@/lib/opportunity-hunt";

export function summarizeValidationOutcomes(leads: readonly Lead[]) {
  const paidStatuses = new Set(["paid_pilot", "repeat_purchase"]);
  const paymentsByCurrency = new Map<string, number>();
  let paidSignals = 0;
  let repeatPurchases = 0;
  let pilotsOffered = 0;

  for (const lead of leads) {
    if (lead.validationStatus === "pilot_offered") pilotsOffered += 1;
    if (lead.validationStatus === "repeat_purchase") repeatPurchases += 1;
    if (lead.validationStatus && paidStatuses.has(lead.validationStatus) && lead.validationPaymentAmount != null && lead.validationPaymentAmount > 0) {
      const currency = lead.validationPaymentCurrency || "INR";
      paymentsByCurrency.set(currency, (paymentsByCurrency.get(currency) ?? 0) + lead.validationPaymentAmount);
      paidSignals += 1;
    }
  }

  return { pilotsOffered, paidSignals, repeatPurchases, paymentsByCurrency: [...paymentsByCurrency].map(([currency, amount]) => ({ currency, amount })) };
}
