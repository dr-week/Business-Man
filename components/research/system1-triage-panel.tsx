"use client";

import { AlertOctagon, HelpCircle, Zap } from "lucide-react";
import type { System1Evaluation } from "@/lib/system1-decision-engine";
import styles from "./system1-triage-panel.module.scss";

const verdictConfig = {
  go_fast: { label: "TEST NEXT", tone: "goFast", icon: Zap },
  hard_pass: { label: "STOP & REVIEW", tone: "hardPass", icon: AlertOctagon },
  pause_investigate: { label: "PAUSE & INVESTIGATE", tone: "pause", icon: HelpCircle },
} as const;

export function System1TriageBadge({ evaluation }: { evaluation: System1Evaluation }) {
  const config = verdictConfig[evaluation.quickVerdict];
  const Icon = config.icon;

  return (
    <span className={`${styles.badge} ${styles[config.tone]}`} title={evaluation.heuristicSummary}>
      <Icon size={12} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export function System1TriagePanel({ evaluation }: { evaluation: System1Evaluation }) {
  return (
    <section className={styles.panel} aria-label="Fast heuristic decision review">
      <header className={styles.header}>
        <span className={styles.eyebrow}><Zap size={13} aria-hidden="true" /> Fast heuristic triage</span>
      </header>
      <p className={styles.summary}>{evaluation.heuristicSummary}</p>
      <p className={styles.disclaimer}>Rules-based screening aid, not Laya model inference or an investment recommendation.</p>
      <div className={styles.coverage}>
        <strong>Evidence coverage: {evaluation.evidenceCoveragePercent}%</strong>
        <span>
          Coverage shows which inputs exist; it is not a probability of success. {evaluation.missingEvidence.length > 0
            ? `Missing: ${evaluation.missingEvidence.join(", ")}.`
            : "All screening inputs are present; verify their quality and recency. A test-next signal is not an investment recommendation."}
        </span>
      </div>
      {evaluation.fatalFlaws.length > 0 && (
        <div className={`${styles.signals} ${styles.hardPass}`}>
          <strong>Issues to review:</strong>
          <ul>{evaluation.fatalFlaws.map((flaw) => <li key={flaw}>{flaw}</li>)}</ul>
        </div>
      )}
      {evaluation.instantMoats.length > 0 && (
        <div className={`${styles.signals} ${styles.goFast}`}>
          <strong>Positive screening signals:</strong>
          <ul>{evaluation.instantMoats.map((signal) => <li key={signal}>{signal}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
