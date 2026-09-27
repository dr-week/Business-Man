import { Lead, HuntEvidence, Gate, nextGate } from "@/lib/opportunity-hunt";

export interface ExecutionStep {
  stepNumber: number;
  phase: Gate;
  action: string;
  outputNeeded: string;
  validationCheck: string;
  isComplete: boolean;
  status: "Completed" | "Current" | "Pending";
}

export interface UnitEconomics {
  targetPriceSignal: string;
  expectedMargin: string;
  firstSaleMilestone: string;
  riskFlags: string[];
}

export interface BusinessBlueprint {
  title: string;
  lane: string;
  buyerPersona: string;
  painHypothesis: string;
  currentGate: Gate;
  steps: ExecutionStep[];
  unitEconomics: UnitEconomics;
  competitorGapAnalysis: {
    incumbentWeakness: string;
    unmetNeed: string;
    falsificationTest: string;
  };
}

/**
 * Builds an actionable, 5-phase business execution blueprint
 * grounded strictly in evidence and falsifiable tests (NOT a simulation).
 */
export function generateBusinessExecutionPlan(lead: Lead, evidenceList: HuntEvidence[] = []): BusinessBlueprint {
  const currentGate: Gate = nextGate(lead);
  const gatesOrder: Gate[] = ["Signal", "Buyer", "Alternatives", "Economics", "Pilot"];
  const currentGateIndex = gatesOrder.indexOf(currentGate);

  const steps: ExecutionStep[] = [
    {
      stepNumber: 1,
      phase: "Signal",
      action: "Anchor the specific failure to an authoritative public, industrial, or regulatory signal.",
      outputNeeded: "Documented regulatory decree, import tariff gap, or traceable published bottleneck.",
      validationCheck: "URL or verifiable primary document with date.",
      isComplete: lead.source.trim().length > 0 && !lead.source.toLowerCase().includes("unverified"),
      status: currentGateIndex > 0 ? "Completed" : "Current",
    },
    {
      stepNumber: 2,
      phase: "Buyer",
      action: "Identify the specific individual title/role whose budget or workflow absorbs this failure daily.",
      outputNeeded: "Concrete buyer persona with purchase authority and recurring pain trigger.",
      validationCheck: "Named role (e.g. 'Plant maintenance manager', 'Export packhouse operator').",
      isComplete: lead.buyer.trim().length > 5,
      status: currentGateIndex > 1 ? "Completed" : currentGateIndex === 1 ? "Current" : "Pending",
    },
    {
      stepNumber: 3,
      phase: "Alternatives",
      action: "Audit what buyers currently use (including manual spreadsheets, consultant fees, or workarounds).",
      outputNeeded: "Catalog of 3 incumbent alternatives and where their coverage terminates.",
      validationCheck: "Explicit alternative pricing and operational flaws recorded.",
      isComplete: lead.alternatives.trim().length > 0 && !/unknown|audit needed/i.test(lead.alternatives),
      status: currentGateIndex > 2 ? "Completed" : currentGateIndex === 2 ? "Current" : "Pending",
    },
    {
      stepNumber: 4,
      phase: "Economics",
      action: "Obtain monetary evidence: quote benchmark, budget ceiling, or willingness-to-pay threshold.",
      outputNeeded: "Target unit price and gross margin model that covers delivery costs.",
      validationCheck: "Non-speculative dollar or rupee quote obtained from at least one prospective buyer.",
      isComplete: lead.payment.trim().length > 0 && !/unverified/i.test(lead.payment),
      status: currentGateIndex > 3 ? "Completed" : currentGateIndex === 3 ? "Current" : "Pending",
    },
    {
      stepNumber: 5,
      phase: "Pilot",
      action: "Conduct the smallest paid pilot or time-boxed proof-of-concept with a real customer.",
      outputNeeded: "Signed LOI, paid deposit, or structured field deployment on live production data.",
      validationCheck: "Customer validates the core failure was prevented in practice.",
      isComplete: false,
      status: currentGateIndex === 4 ? "Current" : "Pending",
    },
  ];

  // Competitor & Gap Analysis
  const competitorGapAnalysis = {
    incumbentWeakness: lead.alternatives.trim() || "No alternatives mapped yet. High risk of incumbent dominance.",
    unmetNeed: lead.failure.trim() || "Unspecified workflow failure.",
    falsificationTest: lead.nextTest.trim() || "Observe 5 prospective buyers performing the workflow manually.",
  };

  // Unit Economics
  const riskFlags: string[] = [];
  if (/unverified/i.test(lead.payment)) {
    riskFlags.push("Willingness to pay unverified — high risk of building something buyers praise but won't fund.");
  }
  if (evidenceList.some((e) => e.direction === "contradicts")) {
    riskFlags.push("Negative field evidence registered. Review contradicting claims before committing capital.");
  }

  const unitEconomics: UnitEconomics = {
    targetPriceSignal: lead.payment.trim() || "Unverified",
    expectedMargin: "Target 40-70% gross margin on operational delivery.",
    firstSaleMilestone: "Secure 1 signed paid letter-of-intent or paid sample run.",
    riskFlags,
  };

  return {
    title: lead.title,
    lane: lead.lane,
    buyerPersona: lead.buyer || "Unspecified buyer persona",
    painHypothesis: lead.failure,
    currentGate,
    steps,
    unitEconomics,
    competitorGapAnalysis,
  };
}
