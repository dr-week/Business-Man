"use client";

import { useEffect, useState } from "react";
import { Users, Award, ShieldAlert, CheckCircle, PlusCircle } from "lucide-react";
import {
  type ResearchContribution,
  type ContributorRole,
  type ContributionVerdict,
  type EvidenceType,
  calculateCommunityReputationImpact,
} from "@/lib/research-collaboration";
import {
  collaborationBountyRecordSchema,
  collaborationContributionRecordSchema,
  opportunityCollaborationResponseSchema,
  type CollaborationBountyRecord,
} from "@/lib/research-bounties";
import type { ResearchOpportunity } from "@/lib/research-engine";

export function ResearchCollaborationPanel({
  opportunity,
  currency = "INR",
}: {
  opportunity: ResearchOpportunity;
  currency?: string;
}) {
  const [bounties, setBounties] = useState<CollaborationBountyRecord[]>([]);
  const [contributions, setContributions] = useState<ResearchContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingBounty, setCreatingBounty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [bountyFormOpen, setBountyFormOpen] = useState(false);
  const [bountyTarget, setBountyTarget] = useState(opportunity.gap || opportunity.problem || "");
  const [bountyReward, setBountyReward] = useState(0);
  const [newClaim, setNewClaim] = useState("");
  const [newRole, setNewRole] = useState<"local_operator" | "field_researcher" | "angel_analyst" | "customer">("local_operator");
  const [newVerdict, setNewVerdict] = useState<"disconfirms" | "confirms" | "warns">("disconfirms");
  const [newEvidenceType, setNewEvidenceType] = useState<"counter_pricing" | "local_supplier" | "regulation" | "pilot_refusal" | "customer_quote">("counter_pricing");
  const [newHandle, setNewHandle] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  const activeBounty = bounties.find((item) => item.status === "open");
  const impact = calculateCommunityReputationImpact(opportunity.strength ?? 50, contributions);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setBounties([]);
    setContributions([]);
    setBountyTarget(opportunity.gap || opportunity.problem || "");

    void (async () => {
      try {
        const response = await fetch(`/api/hunt/bounties?opportunityId=${encodeURIComponent(opportunity.id)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
            ? body.error
            : "Could not load shared research.";
          throw new Error(message);
        }
        const parsed = opportunityCollaborationResponseSchema.safeParse(body);
        if (!parsed.success) throw new Error("Shared research returned an invalid response.");
        setBounties(parsed.data.bounties);
        setContributions(parsed.data.contributions.map((item) => ({
          ...item,
          bountyId: item.bountyId ?? undefined,
          sourceUrl: item.sourceUrl ?? undefined,
        })));
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Could not load shared research.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [opportunity.id, opportunity.gap, opportunity.problem, reloadVersion]);

  async function handleSubmitContribution(e: React.FormEvent) {
    e.preventDefault();
    let sourceUrl: string;
    try {
      const parsed = new URL(newSourceUrl);
      if (parsed.protocol !== "https:") throw new Error("https required");
      sourceUrl = parsed.toString();
    } catch {
      setFormError("Add a valid HTTPS source link so others can check this claim.");
      return;
    }
    if (newClaim.trim().length < 10 || newClaim.trim().length > 1000) {
      setFormError("Describe the observation in 10–1,000 characters.");
      return;
    }

    const contributorHandle = newHandle.trim() || "anonymous_researcher";
    const normalizedHandle = contributorHandle.startsWith("@") ? contributorHandle : `@${contributorHandle}`;
    if (!/^@[a-zA-Z0-9_-]{2,79}$/.test(normalizedHandle)) {
      setFormError("Use a 2–80 character handle with letters, numbers, _ or -.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/hunt/bounties?action=contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(activeBounty ? { bountyId: activeBounty.id } : {}),
          opportunityId: opportunity.id,
          contributorHandle: normalizedHandle,
          contributorRole: newRole,
          evidenceType: newEvidenceType,
          claimSummary: newClaim.trim(),
          verdict: newVerdict,
          sourceUrl,
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : "Could not submit this contribution.";
        throw new Error(message);
      }
      const contributionBody = typeof body === "object" && body !== null && "contribution" in body
        ? body.contribution
        : null;
      const parsed = collaborationContributionRecordSchema.safeParse(contributionBody);
      if (!parsed.success) throw new Error("Contribution response was invalid; reload shared research before retrying.");
      setContributions((current) => [{
        ...parsed.data,
        bountyId: parsed.data.bountyId ?? undefined,
        sourceUrl: parsed.data.sourceUrl ?? undefined,
      }, ...current]);
      setNewClaim("");
      setNewSourceUrl("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not submit this contribution.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateBounty(e: React.FormEvent) {
    e.preventDefault();
    if (bountyTarget.trim().length < 10 || !Number.isInteger(bountyReward) || bountyReward < 0 || bountyReward > 500000) return;
    setCreatingBounty(true);
    setFormError("");
    try {
      const response = await fetch("/api/hunt/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          opportunityName: opportunity.name,
          falsificationTarget: bountyTarget.trim(),
          rewardAmount: bountyReward,
          currency,
          expiresInDays: 14,
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : "Could not create this bounty.";
        throw new Error(message);
      }
      const bountyBody = typeof body === "object" && body !== null && "bounty" in body ? body.bounty : null;
      const parsed = collaborationBountyRecordSchema.safeParse(bountyBody);
      if (!parsed.success) throw new Error("Bounty response was invalid; reload shared research before retrying.");
      setBounties((current) => [parsed.data, ...current]);
      setBountyFormOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create this bounty.");
    } finally {
      setCreatingBounty(false);
    }
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
            <Users size={14} /> Shared Evidence
          </span>
          <h4 style={{ margin: "4px 0 0 0", fontSize: "15px", color: "#eeeae0" }}>
            Community Verification Desk: {opportunity.name}
          </h4>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="archetype-btn" onClick={() => setBountyFormOpen((open) => !open)} disabled={loading || Boolean(loadError)}>
            <PlusCircle size={13} style={{ display: "inline", marginRight: "4px" }} /> Sponsor a review
          </button>
          <div style={{ padding: "4px 10px", background: "#1b2216", border: "1px solid #3d4a32", borderRadius: "6px", fontSize: "12px", color: "var(--gold)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Award size={13} />
            <span>{activeBounty ? `Proposed reward: ${activeBounty.currency} ${activeBounty.rewardAmount.toLocaleString("en-IN")}` : "No active bounty"}</span>
          </div>
          <span style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px", background: impact.consensus === "strongly_disproven" ? "#3a1414" : impact.consensus === "community_validated" ? "#14331b" : "#282b1d", color: "#ddd" }}>
            Signals: {impact.confirmCount} support · {impact.disconfirmCount} counter
          </span>
        </div>
      </header>

      {/* Target Falsification Callout */}
      <div style={{ padding: "10px 12px", background: "#192015", border: "1px solid #37422a", borderRadius: "6px", fontSize: "12px", color: "#ddd8c8", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <strong style={{ color: "var(--gold)" }}>Falsification Target: </strong>
            <span>&ldquo;{activeBounty?.falsificationTarget ?? opportunity.gap ?? opportunity.problem ?? "Add a specific claim to investigate."}&rdquo;</span>
          </div>
          {activeBounty && <div style={{ fontSize: "11px", color: "var(--gold)", background: "#10140e", padding: "2px 8px", borderRadius: "4px", border: "1px solid #2e3626" }}>Payment is not processed in this prototype.</div>}
        </div>
        <div style={{ fontSize: "11px", color: "#8a957d", marginTop: "4px" }}>
          {activeBounty ? "Share a source-linked claim. It stays pending; reviewer actions and payment are not available yet." : "Share source-linked evidence without a reward. Reviewer actions are not available yet."}
        </div>
      </div>

      {bountyFormOpen && <form onSubmit={handleCreateBounty} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 140px auto", gap: "8px", alignItems: "end", background: "#0c0f0a", padding: "12px", borderRadius: "6px", border: "1px solid #232a1c", marginBottom: "14px" }}>
        <label style={{ display: "grid", gap: "5px", color: "#aaa99b", fontSize: "11px" }}>
          Review question
          <input value={bountyTarget} onChange={(event) => setBountyTarget(event.target.value)} minLength={10} maxLength={500} required style={{ padding: "7px 9px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }} />
        </label>
        <label style={{ display: "grid", gap: "5px", color: "#aaa99b", fontSize: "11px" }}>
          Proposed reward ({currency})
          <input type="number" min={0} max={500000} step={1} value={bountyReward} onChange={(event) => setBountyReward(Number(event.target.value))} required style={{ padding: "7px 9px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }} />
        </label>
        <button type="submit" className="archetype-btn is-selected" disabled={creatingBounty}>
          {creatingBounty ? "Saving…" : "Save proposal"}
        </button>
        <span style={{ gridColumn: "1 / -1", color: "#8a957d", fontSize: "11px" }}>Records a proposed bounty only. It does not reserve funds or issue payment.</span>
      </form>}

      {loadError && <p role="alert" style={{ color: "#fca5a5", fontSize: "12px" }}>{loadError} <button type="button" className="archetype-btn" onClick={() => setReloadVersion((version) => version + 1)}>Retry</button></p>}

      {/* Submit Contribution Form */}
      <form onSubmit={handleSubmitContribution} style={{ display: "grid", gap: "8px", background: "#0c0f0a", padding: "12px", borderRadius: "6px", border: "1px solid #232a1c", marginBottom: "14px" }}>
        <p style={{ margin: 0, color: "#8a957d", fontSize: "11px" }}>Submitted handle, claim, and source link are visible to other users viewing this opportunity.</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Your operator handle or X handle"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            style={{ flex: 1, minWidth: "160px", padding: "6px 10px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }}
          />
          <input
            type="url"
            placeholder="Evidence source URL (https://…)"
            aria-label="Evidence source URL"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            required
            style={{ flex: 1, minWidth: "220px", padding: "6px 10px", background: "#171c13", border: "1px solid #333d28", borderRadius: "4px", color: "#eee", fontSize: "12px" }}
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
            disabled={submitting || loading || Boolean(loadError)}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 14px", height: "34px", whiteSpace: "nowrap" }}
          >
            <PlusCircle size={13} /> {submitting ? "Saving…" : "Share evidence"}
          </button>
        </div>
        {formError && <p role="alert" style={{ margin: 0, color: "#fca5a5", fontSize: "12px" }}>{formError}</p>}
        {!loadError && !loading && !contributions.length && <p style={{ margin: 0, color: "#8a957d", fontSize: "11px" }}>No shared submissions yet. Sign in to contribute.</p>}
      </form>

      {/* Contributions Feed */}
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#8a957d" }}>
            {loading ? "Loading shared submissions…" : `${contributions.length} shared submissions · ${impact.confirmCount + impact.disconfirmCount + impact.warningCount} peer-reviewed`}
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
                <span style={{ fontWeight: 600, color: "#eee" }}>{c.contributorHandle.startsWith("@") ? c.contributorHandle : `@${c.contributorHandle}`}</span>
                <span style={{ fontSize: "10px", color: "#8a957d", textTransform: "capitalize" }}>({c.contributorRole.replace("_", " ")})</span>
              </div>
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "#1a2114", color: "var(--gold)" }}>
                {c.evidenceType.replace("_", " ")}
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", color: "#d2cebd" }}>{c.claimSummary}</p>
            {c.sourceUrl && <a href={c.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "6px", color: "var(--gold)", overflowWrap: "anywhere" }}>Open evidence source</a>}
            <span style={{ display: "block", marginTop: "5px", color: c.status === "submitted" ? "#facc15" : "#8a957d" }}>{c.status === "submitted" ? "Pending · reviewer actions are not available yet" : c.status.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
