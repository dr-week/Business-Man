"use client";

import { useState } from "react";
import { Users, Award, ShieldAlert, CheckCircle, PlusCircle } from "lucide-react";
import {
  type ResearchContribution,
  type ResearchBounty,
  type ContributorRole,
  type ContributionVerdict,
  type EvidenceType,
  createDefaultBountyFromOpportunity,
  calculateCommunityReputationImpact,
} from "@/lib/research-collaboration";
import type { ResearchOpportunity } from "@/lib/research-engine";

export function ResearchCollaborationPanel({
  opportunity,
  currency = "INR",
}: {
  opportunity: ResearchOpportunity;
  currency?: string;
}) {
  const [bounty] = useState<ResearchBounty>(() =>
    createDefaultBountyFromOpportunity(opportunity, "Community Research Fund", 5000, currency)
  );

  const [contributions, setContributions] = useState<ResearchContribution[]>([
    {
      id: "sample-contrib-1",
      bountyId: bounty.id,
      opportunityId: opportunity.id,
      contributorHandle: "operator_blr",
      contributorRole: "local_operator",
      evidenceType: "local_supplier",
      claimSummary: "Local vendor in Peenya quotes 25% lower component cost if MOQ > 50 units.",
      verdict: "confirms",
      status: "peer_verified",
      createdAt: "2026-09-28T10:00:00Z",
    },
    {
      id: "sample-contrib-2",
      bountyId: bounty.id,
      opportunityId: opportunity.id,
      contributorHandle: "angel_scout_delhi",
      contributorRole: "angel_analyst",
      evidenceType: "pilot_refusal",
      claimSummary: "2 Tier-2 buyers cited cash flow delays making 90-day invoice terms mandatory.",
      verdict: "warns",
      status: "peer_verified",
      createdAt: "2026-09-29T14:30:00Z",
    },
  ]);

  const [newClaim, setNewClaim] = useState("");
  const [newRole, setNewRole] = useState<"local_operator" | "field_researcher" | "angel_analyst" | "customer">("local_operator");
  const [newVerdict, setNewVerdict] = useState<"disconfirms" | "confirms" | "warns">("disconfirms");
  const [newEvidenceType, setNewEvidenceType] = useState<"counter_pricing" | "local_supplier" | "regulation" | "pilot_refusal" | "customer_quote">("counter_pricing");
  const [newHandle, setNewHandle] = useState("");

  const impact = calculateCommunityReputationImpact(opportunity.strength ?? 70, contributions);

  function handleSubmitContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!newClaim.trim()) return;

    const contrib: ResearchContribution = {
      id: `contrib-${Date.now().toString(36)}`,
      bountyId: bounty.id,
      opportunityId: opportunity.id,
      contributorHandle: newHandle.trim() || "anonymous_researcher",
      contributorRole: newRole,
      evidenceType: newEvidenceType,
      claimSummary: newClaim.trim(),
      verdict: newVerdict,
      status: "peer_verified", // automatically verified for instant UX feedback in workbench
      createdAt: new Date().toISOString(),
    };

    setContributions([contrib, ...contributions]);
    setNewClaim("");
  }

  return (
    <div
      className="research-collaboration-panel"
      style={{
        padding: "16px",
        background: "#121610",
        border: "1px solid #2e3525",
        borderRadius: "10px",
        marginTop: "14px",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gold)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            <Users size={14} /> Open-Source Collaboration & Bounties
          </span>
          <h4 style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#eeeae0" }}>
            Community Verification Desk: {opportunity.name}
          </h4>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ padding: "4px 10px", background: "#1b2216", border: "1px solid #3d4a32", borderRadius: "6px", fontSize: "12px", color: "var(--gold)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Award size={13} />
            <span>Bounty Pool: {bounty.currency} {bounty.rewardAmount.toLocaleString("en-IN")}</span>
          </div>
          <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px", background: impact.consensus === "strongly_disproven" ? "#3a1414" : impact.consensus === "community_validated" ? "#14331b" : "#282b1d", color: "#ddd" }}>
            Consensus: {impact.consensus.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
      </header>

      {/* Target Falsification Callout */}
      <div style={{ padding: "10px 12px", background: "#192015", border: "1px solid #37422a", borderRadius: "6px", fontSize: "12px", color: "#ddd8c8", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <strong style={{ color: "var(--gold)" }}>Falsification Target: </strong>
            <span>"{bounty.falsificationTarget}"</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--gold)", background: "#10140e", padding: "2px 8px", borderRadius: "4px", border: "1px solid #2e3626" }}>
            Payout: {bounty.currency} {calculateBountySplit(bounty.rewardAmount).contributorPayout.toLocaleString("en-IN")} · Escrow Fee (15%): {bounty.currency} {calculateBountySplit(bounty.rewardAmount).platformEscrowFee.toLocaleString("en-IN")}
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "#8a957d", marginTop: "4px" }}>
          Submit verified local pricing, supplier alternatives, or customer refusal data to claim attribution & verification bounties.
        </div>
      </div>

      {/* Submit Contribution Form */}
      <form onSubmit={handleSubmitContribution} style={{ display: "grid", gap: "8px", background: "#0c0f0a", padding: "12px", borderRadius: "6px", border: "1px solid #232a1c", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Your operator handle or X handle"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            style={{ flex: 1, minWidth: "160px", padding: "6px 10px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as ContributorRole)}
            style={{ padding: "6px 10px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }}
          >
            <option value="local_operator">Local Operator</option>
            <option value="field_researcher">Field Researcher</option>
            <option value="angel_analyst">Angel Analyst</option>
            <option value="customer">Target Buyer / Customer</option>
          </select>
          <select
            value={newVerdict}
            onChange={(e) => setNewVerdict(e.target.value as ContributionVerdict)}
            style={{ padding: "6px 10px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: newVerdict === "disconfirms" ? "#f87171" : newVerdict === "confirms" ? "#4ade80" : "#facc15", fontSize: "12px" }}
          >
            <option value="disconfirms">Disconfirms Opportunity (-22 pts)</option>
            <option value="confirms">Confirms Real Demand (+12 pts)</option>
            <option value="warns">Operational Warning (-8 pts)</option>
          </select>
          <select
            value={newEvidenceType}
            onChange={(e) => setNewEvidenceType(e.target.value as EvidenceType)}
            style={{ padding: "6px 10px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }}
          >
            <option value="counter_pricing">Pricing Check</option>
            <option value="local_supplier">Local Supplier Intel</option>
            <option value="pilot_refusal">Buyer Refusal Reason</option>
            <option value="regulation">Regulatory Hurdle</option>
            <option value="customer_quote">Customer LOI / Quote</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Field observation or quote (e.g. Spoke to 3 Jaipur solar farm managers; they require 180-day credit terms)"
            value={newClaim}
            onChange={(e) => setNewClaim(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }}
          />
          <button
            type="submit"
            className="archetype-btn is-selected"
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 14px", height: "34px", whiteSpace: "nowrap" }}
          >
            <PlusCircle size={13} /> Submit Proof
          </button>
        </div>
      </form>

      {/* Contributions Feed */}
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#8a957d" }}>
            {contributions.length} Verified Field Contributions (Adjusted Confidence: {impact.adjustedStrength}/100)
          </span>
        </div>
        {contributions.map((c) => (
          <div
            key={c.id}
            style={{
              padding: "10px 12px",
              background: "#10140e",
              border: `1px solid ${c.verdict === "disconfirms" ? "#4a2121" : c.verdict === "confirms" ? "#224729" : "#3b361a"}`,
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {c.verdict === "disconfirms" && <ShieldAlert size={13} color="#f87171" />}
                {c.verdict === "confirms" && <CheckCircle size={13} color="#4ade80" />}
                {c.verdict === "warns" && <ShieldAlert size={13} color="#facc15" />}
                <span style={{ fontWeight: 600, color: "#eee" }}>@{c.contributorHandle}</span>
                <span style={{ fontSize: "10px", color: "#8a957d", textTransform: "capitalize" }}>({c.contributorRole.replace("_", " ")})</span>
              </div>
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "#1a2114", color: "var(--gold)" }}>
                {c.evidenceType.replace("_", " ")}
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", color: "#d2cebd" }}>{c.claimSummary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
