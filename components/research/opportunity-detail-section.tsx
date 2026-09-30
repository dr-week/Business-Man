"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import type { FinancialAssumptions, ResearchInput, ResearchOpportunity } from "@/lib/research-engine";
import { ValidationPlan } from "@/components/research/validation-plan";
import { ValidationChecklist } from "@/components/research/validation-checklist";
import { EvidenceMap } from "@/components/research/evidence-map";
import { CounterEvidence } from "@/components/research/counter-evidence";
import { MarketingAutomationPanel } from "@/components/research/marketing-automation-panel";
import { ResearchCollaborationPanel } from "@/components/research/research-collaboration-panel";
import { System1TriageBadge, System1TriagePanel } from "@/components/research/system1-triage-panel";
import { FinancialEditor, fields } from "@/components/research/financial-editor";
import { independentSourceCount } from "@/lib/evidence-lineage";
import type { FirstImpression } from "@/lib/first-impressions";

const Charts = dynamic(() => import("../research-charts"), { ssr: false });

const money = (value: number | null | undefined, currency: string) =>
  value == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function Figure({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
      <details>
        <summary>Calculation</summary>
        <p>{detail}</p>
      </details>
    </div>
  );
}

export function OpportunityDetailSection({
  active,
  input,
  currency,
  view,
  runId,
  firstImpressions,
  onOpenAnalysis,
  onExportCsv,
  onSetFirstImpression,
  onUpdateAssumptions,
  onError,
}: {
  active: ResearchOpportunity;
  input: ResearchInput;
  currency: string;
  view: "research" | "analysis" | "economics" | "market" | "sources" | "starred" | "settings" | "profile";
  runId: string | null;
  firstImpressions: Record<string, FirstImpression>;
  onOpenAnalysis?: () => void;
  onExportCsv: (items: ResearchOpportunity[], currency: string) => void;
  onSetFirstImpression: (id: string, choice: FirstImpression) => void;
  onUpdateAssumptions: (id: string, assumptions: FinancialAssumptions) => void;
  onError: (message: string) => void;
}) {
  const independentOrigins = independentSourceCount(active.sources);
  const contradictionCount = active.claims.filter((claim) => claim.direction === "contradicts").length;
  return (
    <article className="research-analysis" aria-label="Selected business analysis">
      <header>
        <div>
          <small>{active.geography}</small>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2>{active.name}</h2>
            <System1TriageBadge opportunity={active} />
          </div>
        </div>
        <button
          className="hunt-icon-action"
          title="Export selected finding"
          aria-label="Export selected finding"
          onClick={() => onExportCsv([active], input.currency)}
        >
          <Download size={16} />
        </button>
      </header>

      <div
        className={`research-figures${
          view === "economics" ? " research-figures-economics" : view === "analysis" ? " research-figures-analysis" : ""
        }`}
      >
        {view !== "economics" && (
          <Figure
            label="Strength"
            value={active.strength == null ? "Unrated" : active.strength + " / 100"}
            detail={active.factors.map((factor) => factor.name + ": " + (factor.score ?? "Unknown") + "/10").join(" · ")}
          />
        )}
        {(view === "economics" || !onOpenAnalysis) && (
          <>
            <Figure
              label="Initial funding"
              value={money(active.financials?.funding, input.currency)}
              detail="Setup + equipment + opening inventory + working capital reserve."
            />
            <Figure
              label="Base monthly profit"
              value={money(active.financials?.scenarios[1].profit, input.currency)}
              detail="(Price − variable cost) × base monthly volume − monthly fixed cost."
            />
            <Figure
              label="Break-even"
              value={
                active.financials
                  ? active.financials.breakEven == null
                    ? "Not achievable"
                    : active.financials.breakEven + " " + active.assumptions.unit + "s / month"
                  : "Unknown"
              }
              detail="Fixed cost ÷ contribution per unit, rounded up."
            />
          </>
        )}
      </div>

      {view !== "economics" && <System1TriagePanel opportunity={active} />}

      <div className="research-detail-modules">
        {view !== "economics" && (
          <details className="research-module" open>
            <summary>Overview · buyer and business case</summary>
            <section className="research-detail-card">
              <dl>
                <dt>Buyer</dt>
                <dd>{active.buyer ?? "Unknown"}</dd>
                <dt>Recurring problem</dt>
                <dd>{active.problem}</dd>
                <dt>Offering</dt>
                <dd>{active.offering ?? "Unqualified"}</dd>
              </dl>
            </section>
          </details>
        )}

        {(view === "economics" || !onOpenAnalysis) && (
          <details className="research-module" open>
            <summary>Inputs · scenarios · charts</summary>
            <section className="research-detail-card">
              <dl>
                <dt>Price / {active.assumptions.unit}</dt>
                <dd>{money(active.assumptions.price.value, input.currency)}</dd>
                <dt>Contribution / {active.assumptions.unit}</dt>
                <dd>{money(active.financials?.contribution, input.currency)}</dd>
                <dt>Base volume</dt>
                <dd>{active.assumptions.baseVolume.value ?? "Unknown"}</dd>
                <dt>Payback</dt>
                <dd>{active.financials?.paybackMonth == null ? "Unknown" : active.financials.paybackMonth + " months"}</dd>
              </dl>
            </section>
            <div className="research-default-charts">
              <Charts kind="scenarios" opportunity={active} currency={input.currency} />
              <Charts kind="breakEven" opportunity={active} currency={input.currency} />
            </div>
            <details className="research-more-charts">
              <summary>Additional charts</summary>
              <div>
                <Charts kind="funding" opportunity={active} currency={input.currency} />
                <Charts kind="cashFlow" opportunity={active} currency={input.currency} />
                <Charts kind="waterfall" opportunity={active} currency={input.currency} />
                <Charts kind="heatmap" opportunity={active} currency={input.currency} />
                <Charts kind="radar" opportunity={active} currency={input.currency} />
                <Charts kind="demand" opportunity={active} currency={input.currency} />
              </div>
            </details>
            <FinancialEditor item={active} onChange={(assumptions) => onUpdateAssumptions(active.id, assumptions)} />
            <details className="research-method">
              <summary>Scoring rules and assumption sources</summary>
              <p>Strength measures evidence coverage and viability, not probability of success. Missing factors keep result Unrated.</p>
              {active.factors.map((factor) => (
                <p key={factor.name}>
                  <b>
                    {factor.name} · {factor.weight} points · {factor.score == null ? "Unknown" : factor.score + "/10"}
                  </b>
                  <br />
                  {factor.rule}
                  {factor.evidenceIds.map((id) => {
                    const claim = active.claims.find((item) => item.id === id);
                    const source = active.sources.find((item) => item.id === claim?.sourceIds[0]);
                    return source && claim ? (
                      <span key={id} className="research-factor-source">
                        <br />
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.provider} · {source.publishedAt.slice(0, 10)}
                        </a>
                        : {claim.text}
                      </span>
                    ) : null;
                  })}
                </p>
              ))}
              {fields.map(([field, label]) => (
                <p key={field}>
                  <b>
                    {label}: {active.assumptions[field].value ?? "Missing"} {active.assumptions[field].unit}
                  </b>
                  <br />
                  {active.assumptions[field].provenance} · {active.assumptions[field].geography} ·{" "}
                  {active.assumptions[field].date ?? "Date missing"} · {active.assumptions[field].note || "No rationale"}
                  {active.assumptions[field].sourceIds.length ? " · Source: " + active.assumptions[field].sourceIds.join(", ") : ""}
                </p>
              ))}
            </details>
          </details>
        )}

        {view !== "economics" && firstImpressions[active.id] && (
          <section className="research-decision-review" aria-label="Decision review">
            <h3>Review your first impression</h3>
            <p>
              You marked this opportunity <strong>{firstImpressions[active.id]}</strong> before reviewing its evidence.
              Reconsider the choice after checking the sources, risks, and missing inputs. This is a reflection prompt, not an
              investment recommendation.
            </p>
            <div className="research-first-impression" role="group" aria-label={`Updated decision for ${active.name}`}>
              {(["investigate", "watch", "pass"] as const).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={firstImpressions[active.id] === choice}
                  onClick={() => onSetFirstImpression(active.id, choice)}
                >
                  {choice === "pass" ? "Pass" : choice === "watch" ? "Watch" : "Investigate"}
                </button>
              ))}
            </div>
          </section>
        )}

        {view !== "economics" && (
          <>
            <ValidationPlan missing={active.missing} />
            <details className="research-module">
              <summary>Field validation log · record checks and evidence</summary>
              <ValidationChecklist opportunityId={active.id} missing={active.missing} onError={onError} />
            </details>
          </>
        )}

        {view !== "economics" && (
          <details className="research-module">
            <summary>
              Evidence · {active.sources.length} links · {independentOrigins} distinct texts · {contradictionCount} contradictions · {active.confidence} confidence
            </summary>
            <section className="research-detail-card">
              <p>
                Distinct-text estimate across source links. This heuristic cannot verify that publishers are independent.
              </p>
              <EvidenceMap sources={active.sources} />
              <details>
                <summary>Source claims and dates</summary>
                {active.claims.map((claim) => (
                  <div className="research-claim" key={claim.id}>
                    <p>{claim.text}</p>
                    <small>
                      {claim.basis ?? claim.direction} · {claim.publishedAt?.slice(0, 10) ?? "Date missing"} ·{" "}
                      <a target="_blank" rel="noreferrer" href={active.sources.find((source) => source.id === claim.sourceIds[0])?.url}>
                        {active.sources.find((source) => source.id === claim.sourceIds[0])?.provider}
                      </a>
                    </small>
                  </div>
                ))}
              </details>
              <details>
                <summary>Source tables and advertised offers</summary>
                {active.sources
                  .filter((source) => source.facts)
                  .map((source) => (
                    <div key={source.id}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      <small>Collected {source.retrievedAt.slice(0, 10)} · Advertised, not verified</small>
                      {!!source.facts?.products.length && (
                        <div className="hunt-table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Quoted price</th>
                                <th>Currency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {source.facts.products.map((product, index) => (
                                <tr key={index}>
                                  <td>{product.name}</td>
                                  <td>{product.price || "—"}</td>
                                  <td>{product.currency || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {!!source.facts?.tables.length && (
                        <div className="hunt-table-scroll">
                          <table aria-label="Source table rows">
                            <tbody>
                              {source.facts.tables.map((row, index) => (
                                <tr key={index}>
                                  {row.map((cell, col) => (
                                    <td key={col}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
              </details>
            </section>
          </details>
        )}

        {view !== "economics" && (
          <details className="research-module">
            <summary>
              Risks · {active.risks.length} risks, {active.claims.filter((claim) => claim.direction === "contradicts").length}{" "}
              contradictions
            </summary>
            <section className="research-detail-card">
              {active.risks.length ? (
                <ul>
                  {active.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              ) : (
                <p>No explicit risks extracted. Check regulation, suppliers, operating costs, and buyer access.</p>
              )}
              <p>
                Contradicting claims: {active.claims.filter((claim) => claim.direction === "contradicts").length}. Absence is not
                agreement.
              </p>
            </section>
          </details>
        )}

        {view !== "economics" && runId && (
          <details className="research-module">
            <summary>Counter-evidence · test what could disprove this</summary>
            <CounterEvidence key={`${runId}:${active.id}`} runId={runId} opportunityId={active.id} />
          </details>
        )}

        {view !== "economics" && (
          <details className="research-module">
            <summary>Marketing & Distribution Playbook · zero-ad-spend growth</summary>
            <MarketingAutomationPanel opportunity={active} currency={input?.currency ?? currency} />
          </details>
        )}

        {view !== "economics" && (
          <details className="research-module">
            <summary>Shared evidence · community bounty proposals</summary>
            <ResearchCollaborationPanel opportunity={active} currency={input?.currency ?? currency} />
          </details>
        )}
      </div>
    </article>
  );
}
