import { Lead, HuntEvidence, Gate, nextGate } from "@/lib/opportunity-hunt";

export type AuditDecision = "Pass" | "Flagged" | "Reject";

export interface EvidenceAuditResult {
  score: number; // 0 to 100
  decision: AuditDecision;
  confidence: "High" | "Medium" | "Low";
  flags: string[];
  reasons: string[];
  recommendedAction: string;
}

/**
 * Lightweight, zero-latency deterministic decision engine (System 1 pattern)
 * for opportunity leads and evidence claims.
 * Performs single-pass rule and heuristic triage over incoming leads/evidence.
 */
export function auditLeadEvidence(lead: Lead, evidenceList: HuntEvidence[] = []): EvidenceAuditResult {
  const flags: string[] = [];
  const reasons: string[] = [];
  let score = 50; // base score

  // 1. Source verification check
  const source = lead.source?.trim() ?? "";
  const isFounderSupplied = /founder-supplied|founder-observed|unverified/i.test(source);
  const hasUrl = /^https?:\/\//i.test(source);

  if (isFounderSupplied) {
    score -= 20;
    flags.push("Unverified / founder-supplied source claim");
    reasons.push("Primary source has not been cross-referenced with independent third-party signals.");
  } else if (hasUrl) {
    score += 15;
    reasons.push("External traceable URL signal provided.");
  }

  // 2. Buyer and Failure clarity
  if (!lead.buyer || lead.buyer.trim().length < 5) {
    score -= 15;
    flags.push("Ambiguous or missing buyer definition");
  } else {
    score += 10;
  }

  if (!lead.failure || lead.failure.trim().length < 15) {
    score -= 15;
    flags.push("Vague failure statement");
  }

  // 3. Alternative/Competitor realism check
  const alternatives = lead.alternatives?.trim().toLowerCase() ?? "";
  if (!alternatives || alternatives === "unknown" || alternatives.includes("audit needed")) {
    score -= 10;
    flags.push("Alternatives unmapped (audit needed)");
  } else {
    score += 10;
  }

  // 4. Evidence depth & contradiction checking
  const supporting = evidenceList.filter((e) => e.direction === "supports");
  const contradicting = evidenceList.filter((e) => e.direction === "contradicts");

  if (supporting.length > 0) {
    score += Math.min(20, supporting.length * 10);
    reasons.push(`${supporting.length} supporting evidence item(s) logged.`);
  }

  if (contradicting.length > 0) {
    // Having contradicting evidence isn't necessarily bad—it means thorough research, but reduces pass score until resolved
    flags.push(`${contradicting.length} contradicting finding(s) registered`);
    reasons.push("Conflicting evidence requires resolution before validation.");
    score -= contradicting.length * 15;
  }

  // Bound score 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine decision
  let decision: AuditDecision = "Flagged";
  if (score >= 70 && flags.length === 0) {
    decision = "Pass";
  } else if (score < 35 || flags.length >= 3) {
    decision = "Reject";
  }

  const confidence: "High" | "Medium" | "Low" =
    evidenceList.length >= 3 ? "High" : evidenceList.length >= 1 ? "Medium" : "Low";

  // Recommendation
  let recommendedAction = "Proceed to next verification stage.";
  const gate: Gate = nextGate(lead);
  if (decision === "Reject") {
    recommendedAction = "Drop or heavily refine failure hypothesis. Lacks credible demand signal.";
  } else if (decision === "Flagged") {
    recommendedAction = `Address open flags before advancing past gate: ${gate}.`;
  }

  return {
    score,
    decision,
    confidence,
    flags,
    reasons,
    recommendedAction,
  };
}
