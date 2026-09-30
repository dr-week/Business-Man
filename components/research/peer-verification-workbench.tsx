"use client";

import { useState } from "react";
import { Users, ShieldAlert, Award, PlusCircle, ExternalLink, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import type { ResearchOpportunity } from "@/lib/research-engine";
import {
  calculatePeerConsensus,
  type ResearchContribution,
  type ResearchBounty,
} from "@/lib/peer-verification";

// Sample verified community contributions for grounded peer-intelligence
const SAMPLE_CONTRIBUTIONS: Record<string, ResearchContribution[]> = {
  default: [
    {
      id: "cont-1",
      opportunityId: "default",
      contributorHandle: "aravind_surat",
      contributorRole: "local_operator",
      evidenceType: "local_supplier",
      claimSummary: "Surat CNC machine shops quote ₹38,000 for aluminum prototype chassis within 48h turnaround.",
      verdict: "confirms",
      sourceUrl: null,
      status: "peer_verified",
      bountyAwarded: 500,
      createdAt: "2026-09-28",
    },
    {
      id: "cont-2",
      opportunityId: "default",
      contributorHandle: "neha_vc_analyst",
      contributorRole: "angel_analyst",
      evidenceType: "counter_pricing",
      claimSummary: "Alternative SaaS in Bengaluru charges ₹2,500/month with zero onboarding fees, eroding target margin.",
      verdict: "warns",
      sourceUrl: "https://example.com/pricing-benchmark",
      status: "peer_verified",
      bountyAwarded: 250,
      createdAt: "2026-09-29",
    },
  ],
};

const SAMPLE_BOUNTY: ResearchBounty = {
  id: "bounty-1",
  opportunityId: "default",
  opportunityName: "Target Opportunity",
  falsificationTarget: "Find 1 supplier who can deliver functional unit under ₹40,000 in India, or 1 buyer rejecting price.",
  rewardAmount: 1500,
  currency: "INR",
  sponsorId: "sponsor-incubator-1",
  status: "open",
  createdAt: "2026-09-25",
  expiresAt: "2026-10-15",
};

export function PeerVerificationWorkbench({
  opportunity,
  currency = "INR",
}: {
  opportunity: ResearchOpportunity;
  currency?: string;
}) {
  const [contributions, setContributions] = useState<ResearchContribution[]>(SAMPLE_CONTRIBUTIONS.default);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [newClaim, setNewClaim] = useState("");
  const [newVerdict, setNewVerdict] = useState<"confirms" | "disconfirms" | "warns">("disconfirms");
  const [newRole, setNewRole] = useState<"local_operator" | "field_researcher" | "angel_analyst" | "prospective_buyer">("local_operator");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  const consensus = calculatePeerConsensus(contributions);

  function handleSubmitContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!newClaim.trim() || !newHandle.trim()) return;

    const newEntry: ResearchContribution = {
      id: `cont-${Date.now()}`,
      opportunityId: opportunity.id,
      contributorHandle: newHandle.trim(),
      contributorRole: newRole,
      evidenceType: "counter_pricing",
      claimSummary: newClaim.trim(),
      verdict: newVerdict,
      sourceUrl: newSourceUrl.trim() || null,
      status: "peer_verified",
      bountyAwarded: newVerdict === "disconfirms" ? 750 : 250,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setContributions([newEntry, ...contributions]);
    setNewClaim("");
    setNewHandle("");
    setNewSourceUrl("");
    setShowSubmitModal(false);
  }

  return (
    <div className="peer-verification-workbench" style={{ background: "#171a14", border: "1px solid #35392e", borderRadius: "10px", padding: "16px", marginTop: "14px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gold)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            <Users size={14} /> Collaborative Intelligence & Peer Verification
          </span>
          <h4 style={{ margin: "4px 0 0 0", fontSize: "16px", color: "#eeeae0" }}>
            Field Verification Desk: {opportunity.name}
          </h4>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="archetype-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--gold)", color: "#171a14", fontWeight: 600, border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
            onClick={() => setShowSubmitModal(!showSubmitModal)}
          >
            <PlusCircle size={14} /> Submit Field Evidence (Earn Bounty)
          </button>
        </div>
      </header>

      {/* Consensus Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "14px" }}>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <small style={{ color: "#aaa99b", fontSize: "10px", textTransform: "uppercase" }}>Consensus Verdict</small>
          <div style={{ fontSize: "14px", fontWeight: 600, color: consensus.consensusVerdict === "peer_supported" ? "#84ce9e" : consensus.consensusVerdict === "peer_challenged" ? "#ed9c91" : "var(--gold)", marginTop: "4px" }}>
            {consensus.consensusVerdict.replace("_", " ").toUpperCase()}
          </div>
        </div>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <small style={{ color: "#aaa99b", fontSize: "10px", textTransform: "uppercase" }}>Peer Confidence</small>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#eeeae0", marginTop: "4px" }}>
            {consensus.peerConfidenceScore !== null ? `${consensus.peerConfidenceScore}/100` : "—"}
          </div>
        </div>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <small style={{ color: "#aaa99b", fontSize: "10px", textTransform: "uppercase" }}>Confirms / Challenges</small>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#eeeae0", marginTop: "4px" }}>
            <span style={{ color: "#84ce9e" }}>+{consensus.confirmsCount}</span> / <span style={{ color: "#ed9c91" }}>-{consensus.disconfirmsCount}</span>
          </div>
        </div>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <small style={{ color: "#aaa99b", fontSize: "10px", textTransform: "uppercase" }}>Active Research Bounty</small>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--gold)", marginTop: "4px" }}>
            {SAMPLE_BOUNTY.currency} {SAMPLE_BOUNTY.rewardAmount.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Active Falsification Bounty Banner */}
      <div style={{ padding: "12px", background: "#1a160e", border: "1px solid #4a3d24", borderRadius: "6px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <strong style={{ color: "var(--gold)", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Award size={14} /> Open Falsification Bounty #{SAMPLE_BOUNTY.id}
          </strong>
          <p style={{ margin: "4px 0 0 0", color: "#ddd9ce", fontSize: "12px" }}>{SAMPLE_BOUNTY.falsificationTarget}</p>
        </div>
        <span style={{ fontSize: "11px", color: "#aaa99b" }}>Sponsored by Incubator Partner</span>
      </div>

      {/* Submission Form Modal / Drawer */}
      {showSubmitModal && (
        <form onSubmit={handleSubmitContribution} style={{ background: "#10140e", border: "1px solid var(--gold)", borderRadius: "8px", padding: "14px", marginBottom: "14px", display: "grid", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong style={{ color: "var(--gold)", fontSize: "13px" }}>Submit Field Evidence & Verification</strong>
            <button type="button" onClick={() => setShowSubmitModal(false)} style={{ background: "none", border: "none", color: "#aaa99b", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ fontSize: "11px", color: "#aaa99b" }}>
              Contributor Handle / Identity
              <input required value={newHandle} onChange={(e) => setNewHandle(e.target.value)} placeholder="e.g. operator_pune" style={{ width: "100%", padding: "6px", background: "#171a14", border: "1px solid #35392e", color: "#eeeae0", borderRadius: "4px", marginTop: "4px" }} />
            </label>
            <label style={{ fontSize: "11px", color: "#aaa99b" }}>
              Your Role
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as "local_operator" | "field_researcher" | "angel_analyst" | "prospective_buyer")} style={{ width: "100%", padding: "6px", background: "#171a14", border: "1px solid #35392e", color: "#eeeae0", borderRadius: "4px", marginTop: "4px" }}>
                <option value="local_operator">Local Operator</option>
                <option value="field_researcher">Field Researcher</option>
                <option value="angel_analyst">Angel / Incubator Analyst</option>
                <option value="prospective_buyer">Prospective Buyer</option>
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label style={{ fontSize: "11px", color: "#aaa99b" }}>
              Evidence Impact (Verdict)
              <select value={newVerdict} onChange={(e) => setNewVerdict(e.target.value as "confirms" | "disconfirms" | "warns")} style={{ width: "100%", padding: "6px", background: "#171a14", border: "1px solid #35392e", color: "#eeeae0", borderRadius: "4px", marginTop: "4px" }}>
                <option value="disconfirms">Disconfirms (Challenges thesis / exposes critical blocker)</option>
                <option value="confirms">Confirms (Verifies local pricing or unmet demand)</option>
                <option value="warns">Warns (Identifies regulatory or margin friction)</option>
              </select>
            </label>
            <label style={{ fontSize: "11px", color: "#aaa99b" }}>
              Source or Reference URL (Optional)
              <input value={newSourceUrl} onChange={(e) => setNewSourceUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "6px", background: "#171a14", border: "1px solid #35392e", color: "#eeeae0", borderRadius: "4px", marginTop: "4px" }} />
            </label>
          </div>
          <label style={{ fontSize: "11px", color: "#aaa99b" }}>
            Claim & Field Findings (Must be factual and verifiable)
            <textarea required rows={3} value={newClaim} onChange={(e) => setNewClaim(e.target.value)} placeholder="State verified quotation, supplier response, or customer objection..." style={{ width: "100%", padding: "8px", background: "#171a14", border: "1px solid #35392e", color: "#eeeae0", borderRadius: "4px", marginTop: "4px" }} />
          </label>
          <button type="submit" style={{ justifySelf: "start", background: "var(--gold)", color: "#171a14", padding: "6px 14px", border: "none", borderRadius: "4px", fontWeight: 600, cursor: "pointer", fontSize: "12px" }}>
            Publish Contribution
          </button>
        </form>
      )}

      {/* Contributions Ledger */}
      <div style={{ display: "grid", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "#aaa99b" }}>Peer Contributions ({contributions.length})</span>
        {contributions.map((c) => (
          <div key={c.id} style={{ padding: "10px 12px", background: "#10140e", border: "1px solid #2e3525", borderRadius: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>@{c.contributorHandle}</span>
                <span style={{ color: "#8b937e", fontSize: "10px", border: "1px solid #35392e", borderRadius: "4px", padding: "1px 5px" }}>{c.contributorRole.replace("_", " ")}</span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: c.verdict === "confirms" ? "#84ce9e" : c.verdict === "disconfirms" ? "#ed9c91" : "var(--gold)",
                }}>
                  {c.verdict === "confirms" && <ThumbsUp size={12} />}
                  {c.verdict === "disconfirms" && <ThumbsDown size={12} />}
                  {c.verdict === "warns" && <AlertTriangle size={12} />}
                  {c.verdict.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {c.bountyAwarded > 0 && (
                  <span style={{ color: "var(--gold)", fontSize: "11px", fontWeight: 600 }}>
                    +{currency} {c.bountyAwarded} Awarded
                  </span>
                )}
                <span style={{ color: "#aaa99b", fontSize: "10px" }}>{c.createdAt}</span>
              </div>
            </div>
            <p style={{ margin: "0 0 4px 0", color: "#dcd8c9", lineHeight: 1.5 }}>{c.claimSummary}</p>
            {c.sourceUrl && (
              <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--gold)", fontSize: "11px", textDecoration: "none" }}>
                View Field Evidence Source <ExternalLink size={10} />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
