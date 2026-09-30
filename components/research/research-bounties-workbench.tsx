"use client";

import { useState } from "react";
import { Users, Plus, ExternalLink } from "lucide-react";
import type { ResearchOpportunity } from "@/lib/research-engine";
import {
  calculateBountySplit,
  evaluateConsensusSignals,
  type PeerContributionItem,
  type ResearchBountyItem,
  type ContributorRole,
  type EvidenceType,
  type ContributionVerdict,
} from "@/lib/research-bounties";

export function ResearchBountiesWorkbench({
  opportunity,
  currency = "INR",
}: {
  opportunity: ResearchOpportunity;
  currency?: string;
}) {
  const [bounties, setBounties] = useState<ResearchBountyItem[]>([
    {
      id: "bounty-mock-1",
      opportunityId: opportunity.id,
      opportunityName: opportunity.name,
      falsificationTarget: `Verify on-the-ground buyer quote or supplier availability for: ${opportunity.gap || opportunity.problem}`,
      rewardAmount: 2500,
      currency,
      sponsorId: "founder_seed",
      status: "open",
      createdAt: "2026-09-28",
      expiresAt: "2026-10-12",
      contributionsCount: 2,
    },
  ]);

  const [contributions, setContributions] = useState<PeerContributionItem[]>([
    {
      id: "c-sample-1",
      bountyId: "bounty-mock-1",
      opportunityId: opportunity.id,
      contributorHandle: "@raj_ops",
      contributorRole: "local_operator",
      evidenceType: "counter_pricing",
      claimSummary: "Interviewed 3 regional distributors: actual unit wholesale cost is 15% lower than modeled if ordered in 50+ batch sizes.",
      verdict: "confirms",
      sourceUrl: "https://indiamart.com",
      status: "peer_verified",
      bountyAwarded: 0,
      createdAt: "2026-09-29",
    },
    {
      id: "c-sample-2",
      bountyId: "bounty-mock-1",
      opportunityId: opportunity.id,
      contributorHandle: "@sneha_diligence",
      contributorRole: "angel_analyst",
      evidenceType: "pilot_refusal",
      claimSummary: "Target buyer cohort in Tier-2 states has existing GST software lock-in that delays migration by at least 6 months.",
      verdict: "warns",
      sourceUrl: "https://gst.gov.in",
      status: "submitted",
      bountyAwarded: 0,
      createdAt: "2026-09-30",
    },
  ]);

  const [newBountyTarget, setNewBountyTarget] = useState("");
  const [newBountyReward, setNewBountyReward] = useState<number>(2000);
  const [showAddBounty, setShowAddBounty] = useState(false);

  // Contributor form state
  const [showSubmitEvidence, setShowSubmitEvidence] = useState(false);
  const [contributorHandle, setContributorHandle] = useState("");
  const [contributorRole, setContributorRole] = useState<ContributorRole>("field_researcher");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("counter_pricing");
  const [verdict, setVerdict] = useState<ContributionVerdict>("disconfirms");
  const [claimSummary, setClaimSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const consensus = evaluateConsensusSignals(contributions);

  function handleCreateBounty(e: React.FormEvent) {
    e.preventDefault();
    if (!newBountyTarget.trim()) return;

    const newBounty: ResearchBountyItem = {
      id: `bounty-${Date.now()}`,
      opportunityId: opportunity.id,
      opportunityName: opportunity.name,
      falsificationTarget: newBountyTarget.trim(),
      rewardAmount: newBountyReward,
      currency,
      sponsorId: "me",
      status: "open",
      createdAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      contributionsCount: 0,
    };

    setBounties([newBounty, ...bounties]);
    setNewBountyTarget("");
    setShowAddBounty(false);
  }

  function handleSubmitContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!contributorHandle.trim() || !claimSummary.trim()) return;

    const newContribution: PeerContributionItem = {
      id: `c-${Date.now()}`,
      bountyId: bounties[0]?.id ?? null,
      opportunityId: opportunity.id,
      contributorHandle: contributorHandle.startsWith("@") ? contributorHandle : `@${contributorHandle}`,
      contributorRole,
      evidenceType,
      claimSummary,
      verdict,
      sourceUrl: sourceUrl.trim() || null,
      status: "submitted",
      bountyAwarded: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setContributions([newContribution, ...contributions]);
    setClaimSummary("");
    setSourceUrl("");
    setShowSubmitEvidence(false);
  }

  return (
    <div className="research-bounties-workbench" style={{ background: "#171a14", border: "1px solid #35392e", borderRadius: "10px", padding: "16px", marginTop: "14px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gold)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            <Users size={14} /> Collaborative Dilegence & Field Bounties
          </span>
          <h4 style={{ margin: "4px 0 0 0", fontSize: "16px", color: "var(--cream)" }}>
            Ground-Truth Verification: {opportunity.name}
          </h4>
          <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "12px", maxWidth: "60ch" }}>
            Crowdsource and sponsor counter-evidence from local operators, field researchers, and early buyers to falsify assumptions before investing capital.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="archetype-btn"
            onClick={() => setShowAddBounty(!showAddBounty)}
            style={{ fontSize: "12px", padding: "6px 10px" }}
          >
            <Plus size={13} style={{ display: "inline", marginRight: "4px" }} /> Sponsor Bounty
          </button>
          <button
            type="button"
            className="archetype-btn is-selected"
            onClick={() => setShowSubmitEvidence(!showSubmitEvidence)}
            style={{ fontSize: "12px", padding: "6px 10px" }}
          >
            Submit Field Evidence
          </button>
        </div>
      </header>

      {/* Consensus Barometer */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "16px" }}>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.04em" }}>Consensus Health</span>
          <strong style={{ display: "block", fontSize: "18px", color: consensus.consensusScore >= 60 ? "#84ce9e" : consensus.consensusScore <= 35 ? "#ed9c91" : "var(--gold)" }}>
            {consensus.consensusScore} / 100
          </strong>
          <small style={{ fontSize: "10px", color: "var(--muted)" }}>Dominant: {consensus.dominantVerdict}</small>
        </div>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.04em" }}>Confirming</span>
          <strong style={{ display: "block", fontSize: "18px", color: "#84ce9e" }}>{consensus.confirmsCount}</strong>
          <small style={{ fontSize: "10px", color: "var(--muted)" }}>Supported claims</small>
        </div>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.04em" }}>Disconfirming</span>
          <strong style={{ display: "block", fontSize: "18px", color: "#ed9c91" }}>{consensus.disconfirmsCount}</strong>
          <small style={{ fontSize: "10px", color: "var(--muted)" }}>Falsification proofs</small>
        </div>
        <div style={{ background: "#121510", border: "1px solid #2f3627", borderRadius: "6px", padding: "10px 12px" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.04em" }}>Warnings</span>
          <strong style={{ display: "block", fontSize: "18px", color: "var(--gold)" }}>{consensus.warnsCount}</strong>
          <small style={{ fontSize: "10px", color: "var(--muted)" }}>Friction / caveats</small>
        </div>
      </div>

      {/* Add Bounty Form */}
      {showAddBounty && (
        <form onSubmit={handleCreateBounty} style={{ background: "#1b2016", border: "1px solid #414b34", borderRadius: "8px", padding: "14px", marginBottom: "16px", display: "grid", gap: "10px" }}>
          <h5 style={{ margin: 0, fontSize: "13px", color: "var(--gold)" }}>Sponsor a Research Bounty</h5>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)" }}>
            Put up an escrow reward for field operators or analysts who can disprove a key risk or verify vendor quotes. (15% platform escrow fee applies on verification).
          </p>
          <label style={{ display: "grid", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
            <span>Falsification Target (Specific question to verify/disprove):</span>
            <input
              type="text"
              required
              minLength={10}
              placeholder="e.g. Can any supplier in Gujarat supply microfiber rollers for under ₹400/unit?"
              value={newBountyTarget}
              onChange={(e) => setNewBountyTarget(e.target.value)}
              style={{ padding: "8px 10px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
            />
          </label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--muted)" }}>
              <span>Reward ({currency}):</span>
              <input
                type="number"
                min={500}
                max={50000}
                step={500}
                value={newBountyReward}
                onChange={(e) => setNewBountyReward(Number(e.target.value))}
                style={{ width: "100px", padding: "6px 8px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
              />
            </label>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
              Contributor receives: {currency} {calculateBountySplit(newBountyReward).contributorPayout.toLocaleString("en-IN")} · Platform Escrow: {currency} {calculateBountySplit(newBountyReward).platformEscrowFee.toLocaleString("en-IN")}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="hunt-primary" style={{ height: "32px", padding: "0 14px", width: "auto", fontSize: "12px" }}>
              Publish Bounty
            </button>
            <button type="button" onClick={() => setShowAddBounty(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: "12px" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Submit Evidence Form */}
      {showSubmitEvidence && (
        <form onSubmit={handleSubmitContribution} style={{ background: "#1b2016", border: "1px solid #414b34", borderRadius: "8px", padding: "14px", marginBottom: "16px", display: "grid", gap: "10px" }}>
          <h5 style={{ margin: 0, fontSize: "13px", color: "var(--gold)" }}>Submit Field Evidence or Counter-Proof</h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <label style={{ display: "grid", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
              <span>Your Handle / Name:</span>
              <input
                type="text"
                required
                placeholder="@handle"
                value={contributorHandle}
                onChange={(e) => setContributorHandle(e.target.value)}
                style={{ padding: "6px 8px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
              />
            </label>
            <label style={{ display: "grid", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
              <span>Your Role:</span>
              <select
                value={contributorRole}
                onChange={(e) => setContributorRole(e.target.value as ContributorRole)}
                style={{ padding: "6px 8px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
              >
                <option value="field_researcher">Field Researcher</option>
                <option value="local_operator">Local Operator</option>
                <option value="angel_analyst">Angel Analyst</option>
                <option value="customer">Target Buyer / Customer</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
              <span>Verdict:</span>
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value as ContributionVerdict)}
                style={{ padding: "6px 8px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
              >
                <option value="disconfirms">❌ Disconfirms (Breaks Model)</option>
                <option value="confirms">✅ Confirms (Validated)</option>
                <option value="warns">⚠️ Warns (Operational Friction)</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
              <span>Evidence Type:</span>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                style={{ padding: "6px 8px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
              >
                <option value="counter_pricing">Counter Pricing</option>
                <option value="local_supplier">Local Supplier</option>
                <option value="pilot_refusal">Pilot Refusal</option>
                <option value="regulatory_hurdle">Regulatory Hurdle</option>
                <option value="unmet_demand">Unmet Demand</option>
              </select>
            </label>
          </div>
          <label style={{ display: "grid", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
            <span>Evidence Summary & Observations:</span>
            <textarea
              required
              minLength={10}
              placeholder="What exact prices, supplier replies, or customer feedback did you discover on the ground?"
              value={claimSummary}
              onChange={(e) => setClaimSummary(e.target.value)}
              style={{ minHeight: "65px", padding: "8px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
            />
          </label>
          <label style={{ display: "grid", gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
            <span>Proof Link (HTTPS Tender, Catalog, or Quote):</span>
            <input
              type="url"
              placeholder="https://..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              style={{ padding: "6px 8px", background: "#121510", border: "1px solid #3c4632", borderRadius: "6px", color: "var(--cream)" }}
            />
          </label>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button type="submit" className="hunt-primary" style={{ height: "32px", padding: "0 14px", width: "auto", fontSize: "12px" }}>
              Submit for Peer Verification
            </button>
            <button type="button" onClick={() => setShowSubmitEvidence(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: "12px" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active Bounties List */}
      <div style={{ marginBottom: "16px" }}>
        <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Active Field Diligence Bounties ({bounties.length})
        </h5>
        <div style={{ display: "grid", gap: "8px" }}>
          {bounties.map((b) => (
            <div key={b.id} style={{ background: "#141811", border: "1px solid #2f3726", borderRadius: "6px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ maxWidth: "75%" }}>
                <span style={{ fontSize: "12px", color: "var(--cream)", fontWeight: 500 }}>{b.falsificationTarget}</span>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                  Sponsor: {b.sponsorId} · Expires: {b.expiresAt ?? "14 days"} · Status: <span style={{ color: "var(--gold)" }}>{b.status}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="hunt-tag" style={{ background: "#262c1d" }}>
                  {b.currency} {b.rewardAmount.toLocaleString("en-IN")} Bounty
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Peer Contributions Feed */}
      <div>
        <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Community Counter-Evidence & Field Logs ({contributions.length})
        </h5>
        <div style={{ display: "grid", gap: "8px" }}>
          {contributions.map((c) => (
            <div key={c.id} style={{ background: "#121510", border: `1px solid ${c.verdict === "disconfirms" ? "#4a2824" : c.verdict === "confirms" ? "#284a32" : "#4a4224"}`, borderRadius: "6px", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "12px", color: "var(--gold)" }}>{c.contributorHandle}</strong>
                  <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase" }}>{c.contributorRole.replace("_", " ")}</span>
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  color: c.verdict === "disconfirms" ? "#ed9c91" : c.verdict === "confirms" ? "#84ce9e" : "#e0c879",
                  background: c.verdict === "disconfirms" ? "#2e1a17" : c.verdict === "confirms" ? "#172e1e" : "#2e2917",
                }}>
                  {c.verdict === "disconfirms" ? "Disconfirms" : c.verdict === "confirms" ? "Confirms" : "Warning"}
                </span>
              </div>
              <p style={{ margin: "4px 0", fontSize: "12px", color: "#ddd9ce" }}>
                {c.claimSummary}
              </p>
              {c.sourceUrl && (
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--gold)", textDecoration: "underline" }}
                >
                  <ExternalLink size={11} /> Source Verification Link
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
