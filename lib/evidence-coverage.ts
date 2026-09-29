type EvidenceItem = { claim: string; source: string; url: string; risk?: boolean };

export type EvidenceCoverage = {
  total: number;
  linked: number;
  sourceDomains: number;
  openQuestions: number;
  nextAction: string;
  actionReason: string;
};

/** Fast evidence triage: prioritizes the next validation task, never an investment verdict. */
export function summarizeEvidence(evidence: EvidenceItem[], fallbackTest: string): EvidenceCoverage {
  const linked = evidence.filter((item) => /^https:\/\//i.test(item.url));
  const domains = new Set<string>();
  for (const item of linked) {
    try { domains.add(new URL(item.url).hostname.replace(/^www\./, "").toLowerCase()); } catch { /* Ignore invalid source URLs. */ }
  }
  const openQuestions = evidence.filter((item) => item.risk).length;
  let nextAction = fallbackTest;
  let actionReason = "Keep the proposed test small and record what would change your decision.";
  if (!evidence.length) {
    nextAction = "Gather one traceable market signal and one buyer interview.";
    actionReason = "No evidence is logged yet; begin with a source and a real buyer.";
  } else if (linked.length < evidence.length) {
    nextAction = "Verify unlinked claims and attach their original sources.";
    actionReason = `${evidence.length - linked.length} claim(s) have no verifiable link.`;
  } else if (!evidence.some((item) => !item.risk)) {
    nextAction = "Test the buyer problem with direct interviews or a paid pilot.";
    actionReason = "The evidence list has no supporting market claim.";
  } else if (openQuestions) {
    nextAction = "Resolve the highest-impact open question with a buyer or field test.";
    actionReason = `${openQuestions} unresolved question(s) remain.`;
  } else if (domains.size < 2) {
    nextAction = "Cross-check the strongest claim with an independent source.";
    actionReason = "Current linked evidence comes from fewer than two source domains.";
  }
  return { total: evidence.length, linked: linked.length, sourceDomains: domains.size, openQuestions, nextAction, actionReason };
}
