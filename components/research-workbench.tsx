"use client";

import { useState } from "react";
import { Archive, Code2, Coins, ExternalLink, FlaskConical, Layers, Package, Scale, Shield, ShieldCheck, User } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities-data";
import { summarizeEvidence } from "@/lib/evidence-coverage";

const TABS = [
  { id: "Case",     icon: Archive    },
  { id: "Evidence", icon: Scale      },
  { id: "Risks",    icon: Shield     },
  { id: "Test",     icon: FlaskConical },
] as const;

type TabId = typeof TABS[number]["id"];

export function ResearchWorkbench({ opportunity }: { opportunity: Opportunity }) {
  const [tab, setTab] = useState<TabId>("Case");

  const supportEvidence = opportunity.evidence.filter((e) => !e.risk);
  const riskEvidence    = opportunity.evidence.filter((e) =>  e.risk);
  const risks = opportunity.risks
    ?? riskEvidence.map((e) => ({ risk: e.claim, mitigation: "Verify before entry." }));
  const coverage = summarizeEvidence(opportunity.evidence, opportunity.nextTest);

  return (
    <>
      <div className="dossier-tabs" role="tablist">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`dossier-tab ${tab === id ? "tab-active" : ""}`}
          >
            <Icon size={11} />
            {id}
          </button>
        ))}
      </div>

      <div className="dossier-body">

        {/* ── Case ──────────────────────────────────────── */}
        {tab === "Case" && (
          <div className="case-grid">
            <Field label="Category" icon={Layers} value={opportunity.category ?? opportunity.market} />
            <Field label="Buyer" icon={User} value={opportunity.buyer ?? "—"} />
            <Field label="Product" icon={Package} value={opportunity.product ?? opportunity.thesis} wide />
            <Field label="Revenue" icon={Coins} value={opportunity.model ?? "—"} />
            <Field label="Skills" icon={Code2} value={opportunity.skills ?? "—"} />
          </div>
        )}

        {/* ── Evidence ──────────────────────────────────── */}
        {tab === "Evidence" && (
          <div className="evidence-workspace">
            <section className="evidence-coverage" aria-label="Evidence coverage">
              <div className="coverage-stats"><Stat label="Claims" value={coverage.total} /><Stat label="Linked sources" value={coverage.linked} /><Stat label="Source domains" value={coverage.sourceDomains} /><Stat label="Open questions" value={coverage.openQuestions} /></div>
              <div className="coverage-next"><span>Next best research step</span><strong>{coverage.nextAction}</strong><small>{coverage.actionReason} This is a research prompt, not an investment recommendation.</small></div>
            </section>
            <div className="evidence-list">
            {supportEvidence.length === 0 && (
              <div className="empty-state">No evidence logged.</div>
            )}
            {supportEvidence.map((item) => (
              <div key={item.claim} className="evidence-row">
                <div className="evidence-dot dot-support" />
                <div className="evidence-text">
                  <div className="evidence-claim">{item.claim}</div>
                  {item.url === "#"
                    ? <span className="evidence-source">{item.source}</span>
                    : <a href={item.url} target="_blank" rel="noreferrer" className="evidence-source">
                        {item.source}<ExternalLink size={10} />
                      </a>
                  }
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* ── Risks ─────────────────────────────────────── */}
        {tab === "Risks" && (
          <div className="risk-list">
            {risks.length === 0 && (
              <div className="empty-state">No risks logged.</div>
            )}
            {risks.map((item) => (
              <div key={item.risk} className="risk-row">
                <Shield size={13} className="risk-icon" />
                <div style={{ flex: 1 }}>
                  <div className="risk-name">{item.risk}</div>
                  <div className="risk-mitig">{item.mitigation}</div>
                </div>
                <ShieldCheck size={13} className="risk-check" />
              </div>
            ))}
          </div>
        )}

        {/* ── Test ──────────────────────────────────────── */}
        {tab === "Test" && (
          <div className="test-card">
            <FlaskConical size={17} />
            <div>
              <span className="test-label">Next move</span>
              <strong className="test-move">{coverage.nextAction}</strong>
              <span className="test-stop">{coverage.actionReason} Update the evidence after the test.</span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

function Field({ label, value, icon: Icon, wide = false }: { label: string; value: string | number; icon?: React.ComponentType<{ size?: number; className?: string }>; wide?: boolean }) {
  return (
    <div className={`dossier-field ${wide ? "field-wide" : ""}`}>
      <span className="field-label" style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
        {Icon && <Icon size={11} className="text-[#c2a663]" />}
        {label}
      </span>
      <span className="field-value">{value ?? "—"}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string | number }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${empty ? "stat-unknown" : ""}`}>{empty ? "—" : value}</span>
    </div>
  );
}
