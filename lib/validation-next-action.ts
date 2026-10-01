type ValidationSignals = {
  openChecks: number;
  disconfirmingChecks: number;
  paidPilotRecords: number;
  repeatPurchases: number;
};

/** A transparent follow-up prompt from saved records, never an investment verdict. */
export function validationNextAction(signals: ValidationSignals) {
  if (signals.openChecks > 0) return {
    title: "Resolve open buyer checks",
    detail: `Record the result, evidence type, and source for ${signals.openChecks} open check${signals.openChecks === 1 ? "" : "s"}.`,
  };
  if (signals.disconfirmingChecks > 0) return {
    title: "Review disconfirming evidence",
    detail: "Revisit the buyer problem or change the next test before committing more investment.",
  };
  if (signals.paidPilotRecords === 0) return {
    title: "Test willingness to pay",
    detail: "Offer a clearly priced pilot and record payment evidence; positive feedback alone is not revenue.",
  };
  if (signals.repeatPurchases === 0) return {
    title: "Check for repeat demand",
    detail: "Follow up after the pilot to see whether the buyer purchases again at a sustainable margin.",
  };
  return {
    title: "Review delivery economics before scaling",
    detail: "Check repeat revenue against delivery costs; these workspace records are not a market forecast.",
  };
}
