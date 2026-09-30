// Refactored System‑1 decision engine using helper utilities to eliminate duplicated signal/fatal‑flaw/instant‑moat logic.

import { type ResearchOpportunity } from "./research-engine";
import { System1Signal, System1Verdict } from "./system1-decision-engine"; // Types remain exported for external use
import { addFatalFlawSignal, addInstantMoatSignal } from "./decisionEngineHelpers";

export type System1Verdict = "go_fast" | "pause_investigate" | "hard_pass";

export interface System1Signal {
  ruleName: string;
  verdict: System1Verdict;
  weight: number;
  triggerReason: string;
}

export interface System1Evaluation {
  opportunityId: string;
  quickVerdict: System1Verdict;
  evidenceCoveragePercent: number;
  missingEvidence: string[];
  speedToDecisionSeconds: number;
  fatalFlaws: string[];
  instantMoats: string[];
  reasons: System1Signal[];
  heuristicSummary: string;
}

/**
 * Evaluates an opportunity using fast System‑1 (LAYA) heuristics.
 * The logic mirrors the original implementation but now delegates repeated
 * push operations to the helper utilities defined in `decisionEngineHelpers`.
 */
export function evaluateSystem1Heuristics(opportunity: ResearchOpportunity): System1Evaluation {
  const fatalFlaws: string[] = [];
  const instantMoats: string[] = [];
  const signals: System1Signal[] = [];

  // ---- 1️⃣ Unit Economics / Contribution Margin ----
  if (opportunity.financials) {
    if (opportunity.financials.contribution <= 0) {
      addFatalFlawSignal(fatalFlaws, signals, {
        ruleName: "Unit Margin Viability",
        weight: 35,
        triggerReason: "Selling price is lower than or equal to variable cost per unit.",
        message: "Negative or zero unit contribution margin (selling at a loss per customer).",
      });
    } else if (opportunity.financials.scenarios[1]?.margin && opportunity.financials.scenarios[1].margin >= 50) {
      const msg = `High base operating margin (${opportunity.financials.scenarios[1].margin.toFixed(0)}%).`;
      addInstantMoatSignal(instantMoats, signals, {
        ruleName: "High Margin Moat",
        weight: 25,
        triggerReason: `Base scenario indicates >50% operating margin (${opportunity.financials.scenarios[1].margin.toFixed(0)}%).`,
        message: msg,
      });
    }
  }

  // ---- 2️⃣ Payback Period Speed ----
  if (opportunity.financials?.paybackMonth) {
    if (opportunity.financials.paybackMonth <= 6) {
      const msg = `Rapid payback period (${opportunity.financials.paybackMonth} months).`;
      addInstantMoatSignal(instantMoats, signals, {
        ruleName: "Rapid Capital Recovery",
        weight: 20,
        triggerReason: `Payback is under 6 months (${opportunity.financials.paybackMonth} mos), minimizing capital risk.`,
        message: msg,
      });
    } else if (opportunity.financials.paybackMonth > 24) {
      const msg = `Long capital lockup (${opportunity.financials.paybackMonth} months payback).`;
      addFatalFlawSignal(fatalFlaws, signals, {
        ruleName: "Capital Lockup",
        weight: 15,
        triggerReason: `Payback exceeds 24 months, high risk of cash depletion before profitability.`,
        message: msg,
      });
    }
  }

  // ---- 3️⃣ Buyer Specificity ----
  if (!opportunity.buyer || opportunity.buyer.toLowerCase().includes("everyone") || opportunity.buyer.toLowerCase().includes("consumers")) {
    const msg = "Vague or missing target buyer persona.";
    addFatalFlawSignal(fatalFlaws, signals, {
      ruleName: "Buyer Persona Specificity",
      weight: 20,
      triggerReason: "Target customer is generic or unspecialized, indicating weak ICP definition.",
      message: msg,
    });
  } else if (opportunity.buyer.length > 10) {
    const msg = `Niche B2B buyer defined: "${opportunity.buyer}".`;
    addInstantMoatSignal(instantMoats, signals, {
      ruleName: "Qualified ICP",
      weight: 15,
      triggerReason: `Specific B2B buyer profile identified.`,
      message: msg,
    });
  }

  // ---- 4️⃣ Contradicting Claims / Negative Research ----
  const contradictingClaims = opportunity.claims?.filter((c) => c.direction === "contradicts") || [];
  if (contradictingClaims.length >= 2) {
    const msg = `${contradictingClaims.length} active contradicting claims discovered in primary research.`;
    addFatalFlawSignal(fatalFlaws, signals, {
      ruleName: "Negative Research Consensus",
      weight: 30,
      triggerReason: `Multiple direct contradicting evidence points exist in source literature.`,
      message: msg,
    });
  }

  // ---- 5️⃣ Gap Clarity ----
  if (opportunity.gap && opportunity.gap.length > 15) {
    const msg = `Distinct wedge: "${opportunity.gap}".`;
    addInstantMoatSignal(instantMoats, signals, {
      ruleName: "Clear Market Gap",
      weight: 15,
      triggerReason: "Specific defensible gap against incumbents is articulated.",
      message: msg,
    });
  }

  // ---- Overall verdict calculation (unchanged) ----
  let quickVerdict: System1Verdict = "pause_investigate";
  const missingEvidence: string[] = [];
  if (!opportunity.buyer?.trim()) missingEvidence.push("Specific target buyer");
  if (!opportunity.financials) missingEvidence.push("Unit economics");
  if (opportunity.sources.length === 0) missingEvidence.push("Traceable sources");
  if (opportunity.claims.length === 0) missingEvidence.push("Buyer or market evidence");
  const evidenceCoveragePercent = Math.round(((4 - missingEvidence.length) / 4) * 100);

  const hardPassCount = signals.filter((s) => s.verdict === "hard_pass").length;
  const goFastCount = signals.filter((s) => s.verdict === "go_fast").length;

  if (hardPassCount >= 1 || fatalFlaws.length >= 2) {
    quickVerdict = "hard_pass";
  } else if (goFastCount >= 2 && fatalFlaws.length === 0) {
    quickVerdict = "go_fast";
  } else {
    quickVerdict = "pause_investigate";
  }

  const heuristicSummary = quickVerdict === "hard_pass"
    ? `System-1 Screen: Immediate Pass recommended. Found ${fatalFlaws.length} fatal flaws including: ${fatalFlaws[0] || "unfavorable unit economics"}.`
    : quickVerdict === "go_fast"
    ? `System-1 Screen: High Momentum signal. Strong moats identified: ${instantMoats[0] || "solid margin and clear ICP"}.`
    : `System-1 Screen: Deliberate deeper (System-2 required). Ambiguous unit economics or untested buyer willingness to pay.`;

  return {
    opportunityId: opportunity.id,
    quickVerdict,
    evidenceCoveragePercent,
    missingEvidence,
    speedToDecisionSeconds: 0.05,
    fatalFlaws,
    instantMoats,
    reasons: signals,
    heuristicSummary,
  };
}
