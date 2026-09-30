"use client";

import { AlertOctagon, HelpCircle, Zap } from "lucide-react";
import { evaluateSystem1Heuristics, type System1Evaluation } from "@/lib/system1-decision-engine";
import type { ResearchOpportunity } from "@/lib/research-engine";
import styles from "./system1-triage-panel.module.scss";

const verdicts = {
  go_fast: { label: "FAST VALIDATION", icon: <Zap size={12} /> },
  hard_pass: { label: "SCREENING STOP", icon: <AlertOctagon size={12} /> },
  pause_investigate: { label: "MORE EVIDENCE NEEDED", icon: <HelpCircle size={12} /> },
} as const;

function VerdictBadge({ result }: { result: System1Evaluation }) {
  const verdict = verdicts[result.quickVerdict];
  return <span className={`${styles.badge} ${styles[result.quickVerdict]}`} title={result.heuristicSummary}>
    {verdict.icon}{verdict.label}
  </span>;
}

export function System1TriageBadge({ opportunity }: { opportunity: ResearchOpportunity }) {
  return <VerdictBadge result={evaluateSystem1Heuristics(opportunity)} />;
}

export function System1TriagePanel({ opportunity }: { opportunity: ResearchOpportunity }) {
  const result = evaluateSystem1Heuristics(opportunity);
  return <section className={styles.panel} aria-label="LAYA System-1 screening">
    <header className={styles.header}>
      <h3><Zap size={14} /> LAYA / System-1 quick screen</h3>
      <VerdictBadge result={result} />
    </header>
    <p className={styles.summary}>{result.heuristicSummary}</p>
    <div className={styles.coverage}>
      <strong>Evidence coverage: {result.evidenceCoveragePercent}%</strong>
      <span>Checks for a buyer, unit economics, and source-linked claims. This is completeness, not probability of success.</span>
      <span>{result.missingEvidence.length ? `Needed before fast validation: ${result.missingEvidence.join(", ")}.` : "All screening inputs are present; verify source quality and recency."}</span>
    </div>
    {result.fatalFlaws.length > 0 && <section className={styles.risks} aria-label="Screening risks">
      <h4>Screening risks · verify assumptions</h4>
      <ul>{result.fatalFlaws.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>}
    {result.instantMoats.length > 0 && <section className={styles.signals} aria-label="Positive signals">
      <h4>Positive signals · validate before investing</h4>
      <ul>{result.instantMoats.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>}
  </section>;
}
