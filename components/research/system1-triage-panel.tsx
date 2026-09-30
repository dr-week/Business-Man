"use client";

import { Zap, AlertOctagon, HelpCircle } from "lucide-react";
import { evaluateSystem1Heuristics } from "@/lib/system1-decision-engine";
import type { ResearchOpportunity } from "@/lib/research-engine";

export function System1TriageBadge({ opportunity }: { opportunity: ResearchOpportunity }) {
  const evalResult = evaluateSystem1Heuristics(opportunity);

  const badgeConfig = {
    go_fast: {
      label: "TEST NEXT",
      color: "#4ade80",
      bg: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.3)",
      icon: <Zap size={12} color="#4ade80" />,
    },
    hard_pass: {
      label: "STOP & REVIEW",
      color: "#f87171",
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.3)",
      icon: <AlertOctagon size={12} color="#f87171" />,
    },
    pause_investigate: {
      label: "PAUSE & INVESTIGATE",
      color: "#fbbf24",
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.3)",
      icon: <HelpCircle size={12} color="#fbbf24" />,
    },
  }[evalResult.quickVerdict];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 8px",
        borderRadius: "4px",
        background: badgeConfig.bg,
        border: `1px solid ${badgeConfig.border}`,
        color: badgeConfig.color,
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
      title={evalResult.heuristicSummary}
    >
      {badgeConfig.icon}
      <span>{badgeConfig.label}</span>
    </div>
  );
}

export function System1TriagePanel({ opportunity }: { opportunity: ResearchOpportunity }) {
  const evalResult = evaluateSystem1Heuristics(opportunity);

  return (
    <div
      style={{
        padding: "14px",
        background: "#11150e",
        border: "1px solid #2a3321",
        borderRadius: "8px",
        marginTop: "12px",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gold)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
          <Zap size={13} /> Fast heuristic triage
        </span>
        <System1TriageBadge opportunity={opportunity} />
      </div>

      <p style={{ margin: "0 0 10px 0", color: "#ddd7c6", lineHeight: 1.5 }}>
        {evalResult.heuristicSummary}
      </p>

      <div style={{ marginBottom: "10px", padding: "8px 10px", background: "#171b13", border: "1px solid #303827", borderRadius: "4px" }}>
        <strong style={{ color: "var(--gold)", fontSize: "11px" }}>Evidence coverage: {evalResult.evidenceCoveragePercent}%</strong>
        <span style={{ display: "block", marginTop: "3px", color: "#aaa99b", fontSize: "11px" }}>
          Coverage shows which inputs exist; it is not a probability of success. {evalResult.missingEvidence.length > 0 ? `Missing: ${evalResult.missingEvidence.join(", ")}.` : "All screening inputs are present; verify their quality and recency. A test-next signal is not an investment recommendation."}
        </span>
      </div>

      {evalResult.fatalFlaws.length > 0 && (
        <div style={{ marginBottom: "8px", padding: "8px 10px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "4px" }}>
          <strong style={{ color: "#f87171", fontSize: "11px", display: "block", marginBottom: "4px" }}>Fatal Flaws Detected (Instant Kill-Switch):</strong>
          <ul style={{ margin: 0, paddingLeft: "16px", color: "#fca5a5", fontSize: "11px" }}>
            {evalResult.fatalFlaws.map((flaw, idx) => (
              <li key={idx}>{flaw}</li>
            ))}
          </ul>
        </div>
      )}

      {evalResult.instantMoats.length > 0 && (
        <div style={{ padding: "8px 10px", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "4px" }}>
          <strong style={{ color: "#4ade80", fontSize: "11px", display: "block", marginBottom: "4px" }}>Momentum Moats Identified:</strong>
          <ul style={{ margin: 0, paddingLeft: "16px", color: "#86efac", fontSize: "11px" }}>
            {evalResult.instantMoats.map((moat, idx) => (
              <li key={idx}>{moat}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
