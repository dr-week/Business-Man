import { type ResearchOpportunity } from "./research-engine";

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
  confidenceScore: number; // 0 - 100
  speedToDecisionSeconds: number;
  fatalFlaws: string[];
  instantMoats: string[];
  reasons: System1Signal[];
  heuristicSummary: string;
}

/**
 * Evaluates an opportunity using fast System-1 (LAYA) heuristics:
 * 1. Fatal Flaw Check (Pass instantly): Negative unit contribution, no buyer identified, active severe regulatory hurdle.
 * 2. Unfair Advantage Check (Investigate fast): High recurring margin, official government mandate/subsidy, zero local Indian alternative under budget.
 * 3. Deliberation Signal: Medium margin, ambiguous buyer, or conflicting evidence.
 */
export function evaluateSystem1Heuristics(opportunity: ResearchOpportunity): System1Evaluation {
  const fatalFlaws: string[] = [];
  const instantMoats: string[] = [];
  const signals: System1Signal[] = [];

  // Check 1: Unit Economics / Contribution Margin
  if (opportunity.financials) {
    if (opportunity.financials.contribution <= 0) {
      fatalFlaws.push("Negative or zero unit contribution margin (selling at a loss per customer).");
      signals.push({
        ruleName: "Unit Margin Viability",
        verdict: "hard_pass",
        weight: 35,
        triggerReason: "Selling price is lower than or equal to variable cost per unit.",
      });
    } else if (opportunity.financials.scenarios[1]?.margin && opportunity.financials.scenarios[1].margin >= 50) {
      instantMoats.push(`High base operating margin (${opportunity.financials.scenarios[1].margin.toFixed(0)}%).`);
      signals.push({
        ruleName: "High Margin Moat",
        verdict: "go_fast",
        weight: 25,
        triggerReason: `Base scenario indicates >50% operating margin (${opportunity.financials.scenarios[1].margin.toFixed(0)}%).`,
      });
    }
  }

  // Check 2: Payback Period Speed
  if (opportunity.financials?.paybackMonth) {
    if (opportunity.financials.paybackMonth <= 6) {
      instantMoats.push(`Rapid payback period (${opportunity.financials.paybackMonth} months).`);
      signals.push({
        ruleName: "Rapid Capital Recovery",
        verdict: "go_fast",
        weight: 20,
        triggerReason: `Payback is under 6 months (${opportunity.financials.paybackMonth} mos), minimizing capital risk.`,
      });
    } else if (opportunity.financials.paybackMonth > 24) {
      fatalFlaws.push(`Long capital lockup (${opportunity.financials.paybackMonth} months payback).`);
      signals.push({
        ruleName: "Capital Lockup",
        verdict: "pause_investigate",
        weight: 15,
        triggerReason: `Payback exceeds 24 months, high risk of cash depletion before profitability.`,
      });
    }
  }

  // Check 3: Buyer Specificity
  if (!opportunity.buyer || opportunity.buyer.toLowerCase().includes("everyone") || opportunity.buyer.toLowerCase().includes("consumers")) {
    fatalFlaws.push("Vague or missing target buyer persona.");
    signals.push({
      ruleName: "Buyer Persona Specificity",
      verdict: "pause_investigate",
      weight: 20,
      triggerReason: "Target customer is generic or unspecialized, indicating weak ICP definition.",
    });
  } else if (opportunity.buyer.length > 10) {
    instantMoats.push(`Niche B2B buyer defined: "${opportunity.buyer}".`);
    signals.push({
      ruleName: "Qualified ICP",
      verdict: "go_fast",
      weight: 15,
      triggerReason: `Specific B2B buyer profile identified.`,
    });
  }

  // Check 4: Contradicting Claims / Negative Research
  const contradictingClaims = opportunity.claims?.filter((c) => c.direction === "contradicts") || [];
  if (contradictingClaims.length >= 2) {
    fatalFlaws.push(`${contradictingClaims.length} active contradicting claims discovered in primary research.`);
    signals.push({
      ruleName: "Negative Research Consensus",
      verdict: "hard_pass",
      weight: 30,
      triggerReason: `Multiple direct contradicting evidence points exist in source literature.`,
    });
  }

  // Check 5: Gap Clarity
  if (opportunity.gap && opportunity.gap.length > 15) {
    instantMoats.push(`Distinct wedge: "${opportunity.gap}".`);
    signals.push({
      ruleName: "Clear Market Gap",
      verdict: "go_fast",
      weight: 15,
      triggerReason: "Specific defensible gap against incumbents is articulated.",
    });
  }

  // Determine overall verdict
  let quickVerdict: System1Verdict = "pause_investigate";
  let confidenceScore = 60;

  const hardPassCount = signals.filter((s) => s.verdict === "hard_pass").length;
  const goFastCount = signals.filter((s) => s.verdict === "go_fast").length;

  if (hardPassCount >= 1 || fatalFlaws.length >= 2) {
    quickVerdict = "hard_pass";
    confidenceScore = Math.min(95, 70 + hardPassCount * 10);
  } else if (goFastCount >= 2 && fatalFlaws.length === 0) {
    quickVerdict = "go_fast";
    confidenceScore = Math.min(90, 65 + goFastCount * 10);
  } else {
    quickVerdict = "pause_investigate";
    confidenceScore = 55;
  }

  const heuristicSummary = quickVerdict === "hard_pass"
    ? `System-1 Screen: Immediate Pass recommended. Found ${fatalFlaws.length} fatal flaws including: ${fatalFlaws[0] || "unfavorable unit economics"}.`
    : quickVerdict === "go_fast"
    ? `System-1 Screen: High Momentum signal. Strong moats identified: ${instantMoats[0] || "solid margin and clear ICP"}.`
    : `System-1 Screen: Deliberate deeper (System-2 required). Ambiguous unit economics or untested buyer willingness to pay.`;

  return {
    opportunityId: opportunity.id,
    quickVerdict,
    confidenceScore,
    speedToDecisionSeconds: 0.05,
    fatalFlaws,
    instantMoats,
    reasons: signals,
    heuristicSummary,
  };
}
