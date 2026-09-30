"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { Download, ExternalLink, Search, Square, GitCompareArrows, Star, Store, BriefcaseBusiness, FileText } from "lucide-react";

import type { Lead } from "@/lib/opportunity-hunt";
import { MarketInspection } from "@/components/research/market-inspection";
import { ResearchFocusCard } from "@/components/research/research-focus-card";
import { SourceLedger } from "@/components/research/source-ledger";
import { WebCandidates } from "@/components/research/web-candidates";
import { OpportunityDetailSection } from "@/components/research/opportunity-detail-section";

import { recalculateOpportunity, type FinancialAssumptions, type ResearchInput, type ResearchOpportunity } from "@/lib/research-engine";
import { downloadDossierReport } from "@/lib/dossier-report";
import { TRENDING_PROMPTS } from "@/lib/trending-prompts";
import type { ResearchFocus, ResearchFocusSource } from "@/lib/research-focus";
import type { WebResearchResult } from "@/lib/collectors/brave-search";
import { independentSourceCount } from "@/lib/evidence-lineage";
import { parseFirstImpressions, recordFirstImpression, type FirstImpression } from "@/lib/first-impressions";

const Charts = dynamic(() => import("./research-charts"), { ssr: false });

const storageKey = "businessman.research.v2";

const money = (value: number | null | undefined, currency: string) => value == null ? "â€”" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function persist(input: ResearchInput, opportunities: ResearchOpportunity[]) {

  try { localStorage.setItem(storageKey, JSON.stringify({ input, opportunities })); } catch { /* storage unavailable */ }

}

function exportCsv(items: ResearchOpportunity[], currency: string) {

  const rows = [["Opportunity", "Category", "Strength", "Confidence", "Investment " + currency, "Base monthly profit " + currency, "Evidence count", "Sources"],

    ...items.map((item) => [item.name, item.category, item.strength ?? "Unrated", item.confidence, item.financials?.funding ?? "Unknown", item.financials?.scenarios[1].profit ?? "Unknown", independentSourceCount(item.sources), item.sources.map((source) => source.url).join(" ")])];

  const cell = (value: string | number) => '"' + String(value).replace(/"/g, '""') + '"';

  const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));

  const link = document.createElement("a"); link.href = url; link.download = "opportunity-research.csv"; link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

}

export function SourceDiscovery({ view = "research", onSaved: _onSaved, onError, initialTopic, onOpenAnalysis, onOpenResearch = () => {} }: { view?: "research" | "analysis" | "economics" | "market" | "sources" | "starred" | "settings" | "profile"; onSaved: (lead: Lead) => void; onError: (message: string) => void; initialTopic?: string; onOpenAnalysis?: () => void; onOpenResearch?: () => void }) {

  const abort = useRef<AbortController | null>(null);
  const [stars, setStars] = useState<string[]>([]);

  function toggleStar(id: string) {

    const next = stars.includes(id) ? stars.filter((item) => item !== id) : [...stars, id];

    try { localStorage.setItem("businessman.starred.v1", JSON.stringify(next)); setStars(next); }

    catch { onError("Could not save favorites on this device."); }

  }

  useEffect(() => {

    try { const ids: unknown = JSON.parse(localStorage.getItem("businessman.starred.v1") ?? "[]"); if (Array.isArray(ids)) setStars(ids.filter((id): id is string => typeof id === "string")); } catch { /* Ignore invalid local favorites. */ }

    return () => abort.current?.abort();

  }, []);

  const [topic, setTopic] = useState(""), [geography, setGeography] = useState("Goa, India"), [budget, setBudget] = useState("");

  const [minimumInvestment, setMinimumInvestment] = useState("0");
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [currency, setCurrency] = useState("INR");

  const [sourceUrls, setSourceUrls] = useState("");
  const [industry, setIndustry] = useState(""), [businessModel, setBusinessModel] = useState(""), [customer, setCustomer] = useState(""), [driver, setDriver] = useState("");

  const [input, setInput] = useState<ResearchInput | null>(null), [opportunities, setOpportunities] = useState<ResearchOpportunity[]>([]);
  const [runId, setRunId] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null), [compare, setCompare] = useState<string[]>([]);
  const [firstImpressions, setFirstImpressions] = useState<Record<string, FirstImpression>>({});
  const setFirstImpression = (id: string, choice: FirstImpression) => setFirstImpressions((current) => {
    const next = recordFirstImpression(current, id, choice);
    try { localStorage.setItem("businessman.first-impressions.v1", JSON.stringify(next)); } catch { onError("Could not save your decision on this device."); }
    return next;
  });
  useEffect(() => { try { setFirstImpressions(parseFirstImpressions(JSON.parse(localStorage.getItem("businessman.first-impressions.v1") ?? "{}"))); } catch { /* Ignore invalid local decisions. */ } }, []);

  const [sort, setSort] = useState<"name" | "strength" | "investment" | "profit" | "evidence">("strength");

  const [busy, setBusy] = useState(false), [progress, setProgress] = useState("");

  const [preparedBrief, setPreparedBrief] = useState("");
  const [interpretation, setInterpretation] = useState<{ brief: string; original: string; searchTerms: string; classifier: string; researchFocus: ResearchFocus; researchFocusSource: ResearchFocusSource; suggestions: { word: string; options: string[] }[] } | null>(null);
  const [providerErrors, setProviderErrors] = useState<string[]>([]);
  const [webResearch, setWebResearch] = useState<WebResearchResult[]>([]);
  const [webSearchConfigured, setWebSearchConfigured] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [researchMode, setResearchMode] = useState<"ideas" | "market" | "franchise">("ideas");

  useEffect(() => {
    let active = true;
    fetch("/api/hunt/research-runs", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ runs?: { id?: string; input?: ResearchInput; result?: { opportunities?: ResearchOpportunity[]; query?: NonNullable<typeof interpretation> } }[] }> : null)
      .then((data) => {
        const latest = data?.runs?.[0];
        if (!active || !latest?.input || !Array.isArray(latest.result?.opportunities)) return;
        setRunId(latest.id ?? null); setInput(latest.input); setOpportunities(latest.result.opportunities);
        setTopic(latest.input.topic); setGeography(latest.input.geography); setBudget(latest.input.budget == null ? "" : String(latest.input.budget));
        setPreparedBrief(latest.result.query?.brief ?? ""); setInterpretation(latest.result.query ?? null);
      })
      .catch(() => { /* Local snapshot remains available when archive is unavailable. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (topic) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % TRENDING_PROMPTS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [topic]);



  useEffect(() => {

    try {

      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { input?: ResearchInput; opportunities?: ResearchOpportunity[] } | null;

      if (!saved?.input || !Array.isArray(saved.opportunities)) return;

      setInput(saved.input); setOpportunities(saved.opportunities);

      setTopic(saved.input.topic); setSourceUrls((saved.input.sourceUrls ?? []).join("\n"));

      setIndustry(saved.input.industry ?? ""); setBusinessModel(saved.input.businessModel ?? ""); setCustomer(saved.input.customer ?? ""); setDriver(saved.input.driver ?? "");

      setProgress("");

    } catch { /* invalid saved result */ }

  }, []);


  useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
      setTopic(initialTopic.trim());
    }
  }, [initialTopic]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("businessman.preferences.v1") ?? "null");
      if (!saved) return;
      if (typeof saved.geography !== "string" || saved.geography.trim().length < 2 || saved.geography.length > 100 || !["INR", "USD", "EUR", "GBP"].includes(saved.currency)) return;
      if (!Number.isFinite(saved.minimumInvestment) || saved.minimumInvestment < 0 || saved.minimumInvestment > 1e9 || (saved.budget !== null && (!Number.isFinite(saved.budget) || saved.budget < saved.minimumInvestment || saved.budget > 1e9))) return;
      setGeography(saved.geography); setCurrency(saved.currency); setBudget(saved.budget == null ? "" : String(saved.budget)); setMinimumInvestment(String(saved.minimumInvestment));
    } catch { /* Keep defaults for invalid preferences. */ }
  }, []);
  function savePreferences(event: React.FormEvent) {
    event.preventDefault();
    const min = minimumInvestment === "" ? 0 : Number(minimumInvestment);
    const max = budget === "" ? null : Number(budget);
    if (!Number.isFinite(min) || min < 0 || min > 1e9 || (max != null && (!Number.isFinite(max) || max < min || max > 1e9))) { onError("Minimum investment must not exceed maximum budget."); return; }
    try { localStorage.setItem("businessman.preferences.v1", JSON.stringify({ geography: geography.trim(), currency, minimumInvestment: min, budget: max })); setPreferencesSaved(true); onError(""); }
    catch { onError("Could not save preferences on this device."); }
  }
  const ordered = useMemo(() => [...opportunities].sort((a, b) => {

    if (sort === "name") return a.name.localeCompare(b.name);

    if (sort === "evidence") return independentSourceCount(b.sources) - independentSourceCount(a.sources);

    if (sort === "investment") return (a.financials?.funding ?? Infinity) - (b.financials?.funding ?? Infinity);

    if (sort === "profit") return (b.financials?.scenarios[1].profit ?? -Infinity) - (a.financials?.scenarios[1].profit ?? -Infinity);

    return (b.strength ?? -1) - (a.strength ?? -1) || independentSourceCount(b.sources) - independentSourceCount(a.sources);

  }), [opportunities, sort]);

  const active = opportunities.find((item) => item.id === selected);

  async function research(event: React.FormEvent | null, useOriginalQuery = false, overrideTopic?: string) {

    event?.preventDefault(); if (busy) return;

    const next: ResearchInput = { topic: (overrideTopic ?? topic).trim(), useOriginalQuery, geography: geography.trim(), budget: budget === "" ? null : Number(budget), minimumInvestment: minimumInvestment === "" ? 0 : Number(minimumInvestment), currency,

      sourceUrls: sourceUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
      ...(industry ? { industry } : {}), ...(businessModel ? { businessModel } : {}), ...(customer ? { customer } : {}), ...(driver ? { driver } : {}) };

    if ((next.sourceUrls?.length ?? 0) > 3) { onError("Use at most 3 source URLs."); return; }
    if (next.budget != null && (next.minimumInvestment ?? 0) > next.budget) { onError("Check investment range in Personalisation."); return; }
    const controller = new AbortController(); abort.current = controller;

    setBusy(true); setProgress("Collecting sources"); setProviderErrors([]); setWebResearch([]); setWebSearchConfigured(false); onError("");

    try {

      const response = await fetch("/api/hunt/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next), signal: controller.signal });

      const data = await response.json() as { error?: string; runId?: string; query?: { brief: string; original: string; searchTerms: string; classifier: string; researchFocus: ResearchFocus; researchFocusSource: ResearchFocusSource; suggestions: { word: string; options: string[] }[] }; opportunities: ResearchOpportunity[]; providerErrors: string[]; webResearch?: WebResearchResult[]; webSearchConfigured?: boolean };

      if (!response.ok) throw new Error(data.error ?? "Research failed.");

      setRunId(data.runId ?? null); setPreparedBrief(data.query?.brief ?? ""); setInterpretation(data.query ?? null); setInput(next); setOpportunities(data.opportunities); setProviderErrors(data.providerErrors); setWebResearch(data.webResearch ?? []); setWebSearchConfigured(!!data.webSearchConfigured);

      setSelected(null); setCompare([]); persist(next, data.opportunities);

      setProgress(data.opportunities.length ? data.opportunities.length + " findings grouped and qualified" : data.webResearch?.length ? data.webResearch.length + " web results ready to review; no scored leads yet" : "No findings; broaden the topic or location");

    } catch (error) { if (!controller.signal.aborted) { onError((error as Error).message); setProgress(""); } else setProgress("Research cancelled"); }

    finally { setBusy(false); abort.current = null; }

  }

  function updateAssumptions(id: string, assumptions: FinancialAssumptions) {

    if (!input) return;

    setOpportunities((current) => {

      const next = current.map((item) => item.id === id ? recalculateOpportunity({ ...item, assumptions }, input.budget) : item);

      persist(input, next); return next;

    });

  }

  return <section className="research-workspace" aria-label="Market research">

    <form hidden={view !== "research"} className="research-bar" onSubmit={(event) => void research(event)}>

      <label className="research-topic"><span>Topic</span><input required minLength={2} maxLength={1000} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={`e.g. ${TRENDING_PROMPTS[placeholderIndex] || "Research a business…"}`} /></label>
      <label><span>Location</span><input required minLength={2} maxLength={100} value={geography} onChange={(event) => setGeography(event.target.value)} placeholder="City, region, or country" /></label>
      <label><span>Available budget</span><input min="0" max="1000000000" type="number" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Optional" /></label>
      <label className="research-currency"><span>Currency</span><select aria-label="Budget currency" value={currency} onChange={(event) => setCurrency(event.target.value)}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
      <button className="research-submit" disabled={busy} type="submit"><Search size={16} />{busy ? "Researching…" : "Research"}</button>

      {busy && <button className="hunt-icon-action" type="button" title="Cancel research" aria-label="Cancel research" onClick={() => abort.current?.abort()}><Square size={14} /></button>}

    </form>

    <div hidden={view !== "research" || !!opportunities.length} className="research-intro">
      <div className="research-mode" role="tablist" aria-label="Research goal">
        <button type="button" role="tab" aria-selected={researchMode === "ideas"} onClick={() => { setResearchMode("ideas"); setTopic(""); }}><BriefcaseBusiness size={16} />Find a business idea</button>
        <button type="button" role="tab" aria-selected={researchMode === "market"} onClick={() => { setResearchMode("market"); setTopic(""); }}><Search size={16} />Check a market</button>
        <button type="button" role="tab" aria-selected={researchMode === "franchise"} onClick={() => { setResearchMode("franchise"); setTopic(""); }}><Store size={16} />Compare franchises</button>
      </div>
      <p>{researchMode === "franchise" ? "Compare franchise brands using official disclosure documents, fee schedules, and franchisee conversations. Add brand names and source links; unknown terms stay unknown." : researchMode === "market" ? "Name a product, service, or industry and a location. Look for demand signals, competitors, and risks, then verify them with buyers." : "Start with a problem, product, skill, or place. Find a lead, see its evidence, then validate the opportunity with a buyer."}</p>
      <div className="research-starters" aria-label="Example research questions">
        {(researchMode === "franchise" ? ["Compare food franchises under my budget", "What should I check before buying a franchise?", "Compare franchise fees, closures, and territory terms"] : researchMode === "market" ? ["Demand for cold storage in Goa", "Compare laundry services in Panaji", "Market gaps for food processing in India"] : ["What can I sell to hotels in Goa?", "Business ideas using an empty garage", "Problems buyers pay to solve in food processing"]).map((prompt) => <button key={prompt} type="button" onClick={() => setTopic(prompt)}>{prompt}</button>)}
      </div>
    </div>
    <form hidden={view !== "profile"} className="research-personalisation" onSubmit={savePreferences} onChange={() => setPreferencesSaved(false)}>
      <label>Location<input required minLength={2} maxLength={100} value={geography} onChange={(event) => setGeography(event.target.value)} placeholder="e.g. Goa, India" /></label>

      <label>Maximum budget<input min="0" max="1000000000" type="number" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Not set" /></label>

      <select aria-label="Currency" value={currency} onChange={(event) => setCurrency(event.target.value)}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select>

      <label>Minimum investment<input type="number" min="0" max="1000000000" value={minimumInvestment} onChange={(event) => setMinimumInvestment(event.target.value)} placeholder="0" /></label>
      <button className="hunt-create-submit" type="submit">Save</button><span role="status">{preferencesSaved ? "Saved" : ""}</span>
    </form>
    {preparedBrief && view === "research" && <details className="hunt-source-caption"><summary>Search interpretation</summary><p>{interpretation?.searchTerms ?? preparedBrief}</p><small>{interpretation?.classifier}</small>
      {interpretation && <ResearchFocusCard focus={interpretation.researchFocus} source={interpretation.researchFocusSource} topic={input?.topic ?? topic} geography={input?.geography ?? geography} />}
      {interpretation?.suggestions.map((suggestion, index) => <div key={index}>{suggestion.word}: {suggestion.options.map((option) => <button className="hunt-tag" disabled={busy} key={option} title={"Search with " + option} onClick={() => { const corrected = interpretation.original.replace(suggestion.word, option); setTopic(corrected); void research(null, false, corrected); }}>{option}</button>)}</div>)}
      <button className="hunt-tag" disabled={busy} onClick={() => void research(null, true, interpretation?.original)}>Search original</button></details>}
    <section hidden={view !== "settings"} className="research-filters" aria-label="Business filters"><div>

      <label>Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Software, agricultureâ€¦" /></label>

      <label>Model<input value={businessModel} onChange={(event) => setBusinessModel(event.target.value)} placeholder="Subscription, serviceâ€¦" /></label>

      <label>Customer<input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Small businessâ€¦" /></label>

      <label>Driver<input value={driver} onChange={(event) => setDriver(event.target.value)} placeholder="Workflow failureâ€¦" /></label>

    </div><label>Web sources<textarea aria-label="Web source URLs" value={sourceUrls} onChange={(event) => setSourceUrls(event.target.value)} placeholder="Up to 3 public HTTPS URLs, one per line" rows={3} /></label><small>Applies to your next search.</small></section>

    <div hidden={!progress && !providerErrors.length} className="research-status" aria-live="polite">{progress && <span>{progress}</span>}{providerErrors.length > 0 && <span className="research-provider-errors">Some sources could not be reached: {providerErrors.join(", ")}</span>}</div>

    <div hidden={view === "settings" || view === "profile"}>

    {view === "sources" && <><SourceLedger opportunities={opportunities} />{input && <WebCandidates results={webResearch} configured={webSearchConfigured} />}</>}

    {opportunities.length > 0 && view === "research" && <section className="research-decision-strip" aria-label="Research quality summary">
      <div><span>Leads found</span><strong>{opportunities.length}</strong></div>
      <div><span>With linked sources</span><strong>{opportunities.filter((item) => item.sources.length > 0).length}</strong></div>
      <div><span>With enough data to score</span><strong>{opportunities.filter((item) => item.strength !== null).length}</strong></div>
    </section>}


    {(view === "research" || view === "starred") && !!ordered.filter((item) => view !== "starred" || stars.includes(item.id)).length && <section className="research-results" aria-label="Ranked findings">

      <header><div><h2>{view === "starred" ? "Starred" : "Results"}</h2></div>

        <div className="research-export-actions" style={{ display: "flex", gap: "6px" }}>
          <button
            className="hunt-icon-action"
            title="Download Executive Dossier (Markdown)"
            aria-label="Download Executive Dossier (Markdown)"
            disabled={!opportunities.length}
            onClick={() =>
              downloadDossierReport(
                compare.length ? opportunities.filter((item) => compare.includes(item.id)) : ordered,
                {
                  title: `${input?.topic ?? topic} Market Dossier`,
                  topic: input?.topic ?? topic,
                  geography: input?.geography ?? geography,
                  generatedDate: new Date().toISOString().slice(0, 10),
                  currency: input?.currency ?? currency,
                  opportunitiesCount: compare.length ? compare.length : ordered.length,
                }
              )
            }
          >
            <FileText size={16} />
          </button>
          <button className="hunt-icon-action" title="Export results CSV" aria-label="Export results CSV" disabled={!opportunities.length} onClick={() => exportCsv(compare.length ? opportunities.filter((item) => compare.includes(item.id)) : ordered, input?.currency ?? currency)}><Download size={16} /></button>
        </div></header>

      <div className="hunt-table-scroll"><table><thead><tr>

        <th><button onClick={() => setSort("name")}>Opportunity</button></th><th>Area</th><th><button onClick={() => setSort("strength")}>Evidence</button></th><th>Confidence</th>

        <th><button onClick={() => setSort("investment")}>Investment</button></th><th><button onClick={() => setSort("profit")}>Base profit / month</button></th>

        <th><button onClick={() => setSort("evidence")}>Independent sources</button></th><th>Actions</th><th>Decision</th></tr></thead><tbody>

        {ordered.filter((item) => view !== "starred" || stars.includes(item.id)).map((item) => <tr key={item.id} aria-selected={selected === item.id}>

          <td data-label="Opportunity"><button className="research-star" title={stars.includes(item.id) ? "Unstar" : "Star"} aria-label={(stars.includes(item.id) ? "Unstar " : "Star ") + item.name} aria-pressed={stars.includes(item.id)} onClick={() => toggleStar(item.id)}><Star size={16} fill={stars.includes(item.id) ? "currentColor" : "none"} /></button><button className="hunt-open" onClick={() => { setSelected(item.id); onOpenAnalysis?.(); }}>{item.name}</button></td>

          <td data-label="Area">{item.category}</td><td data-label="Evidence">{item.strength == null ? "Needs checking" : item.strength + " / 100"}</td><td data-label="Confidence">{item.confidence}</td>

          <td data-label="Investment" className="hunt-number">{money(item.financials?.funding, input?.currency ?? currency)}</td>

          <td data-label="Profit / month" className="hunt-number">{money(item.financials?.scenarios[1].profit, input?.currency ?? currency)}</td>

          <td data-label="Sources" title={`${item.sources.length} source links`}>{independentSourceCount(item.sources)}</td><td className="research-actions">

            {item.sources[0] && <a href={item.sources[0].url} target="_blank" rel="noreferrer" title="Open first source" aria-label={"Open source for " + item.name}><ExternalLink size={15} /></a>}

            <button title={compare.includes(item.id) ? "Remove from comparison" : "Add to comparison"} aria-label={(compare.includes(item.id) ? "Remove " : "Compare ") + item.name} aria-pressed={compare.includes(item.id)} onClick={() => setCompare((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}><GitCompareArrows size={15} /></button>

          </td>
          <td data-label="Decision"><div className="research-first-impression" role="group" aria-label={`Decision for ${item.name}`}>{(["investigate", "watch", "pass"] as const).map((choice) => <button key={choice} type="button" aria-pressed={firstImpressions[item.id] === choice} onClick={() => setFirstImpression(item.id, choice)}>{choice === "pass" ? "Pass" : choice === "watch" ? "Watch" : "Investigate"}</button>)}</div></td>

        </tr>)}

      </tbody></table></div>

    </section>}

    {(view === "research" || view === "starred") && !ordered.filter((item) => view !== "starred" || stars.includes(item.id)).length && <p className="research-empty">{view === "starred" ? "No starred opportunities." : "Search a market to begin."}</p>}
    {view === "analysis" && !active && <p className="research-empty">Select a result in <button type="button" className="hunt-open" onClick={onOpenResearch}>Research</button>.</p>}
    {view === "economics" && !active && <p className="research-empty">Select a result in <button type="button" className="hunt-open" onClick={onOpenResearch}>Research</button>.</p>}
    {view === "market" && !active && <p className="research-empty">Select a result in <button type="button" className="hunt-open" onClick={onOpenResearch}>Research</button>.</p>}
    {view === "market" && active && <article className="research-analysis" aria-label="Local market"><header><h2>{active.name}</h2></header><MarketInspection key={active.id} opportunity={active} /></article>}
    {view === "analysis" && compare.length > 0 && <section className="research-compare"><header><div><h3>Compare</h3></div><button type="button" className="research-compare-clear" onClick={() => setCompare([])}>Clear selection</button></header>
      {compare.length > 1 ? <Charts kind="comparison" opportunities={opportunities.filter((item) => compare.includes(item.id))} currency={input?.currency ?? currency} /> : <p className="research-compare-hint">Select one more lead to compare them side by side.</p>}
    </section>}

    {(view === "analysis" || view === "economics" || !onOpenAnalysis) && active && input && (
      <OpportunityDetailSection
        active={active}
        input={input}
        currency={input?.currency ?? currency}
        view={view}
        runId={runId}
        firstImpressions={firstImpressions}
        onOpenAnalysis={onOpenAnalysis}
        onExportCsv={exportCsv}
        onSetFirstImpression={setFirstImpression}
        onUpdateAssumptions={updateAssumptions}
        onError={onError}
      />
    )}

    </div>
  </section>;

}


