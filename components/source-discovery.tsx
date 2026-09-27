"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { Download, ExternalLink, Search, Square, GitCompareArrows, Star } from "lucide-react";

import type { Lead } from "@/lib/opportunity-hunt";

import { calculateFinancials, recalculateOpportunity, type FinancialAssumptions, type ResearchInput, type ResearchOpportunity, type Provenance } from "@/lib/research-engine";
import { TRENDING_PROMPTS } from "@/lib/trending-prompts";



const Charts = dynamic(() => import("./research-charts"), { ssr: false });

const storageKey = "businessman.research.v2";

const fields = [

  ["price", "Selling price"], ["variableCost", "Variable cost"], ["fixedCost", "Monthly fixed cost"],

  ["setupCost", "Setup"], ["equipmentCost", "Equipment"], ["openingInventory", "Opening inventory"], ["reserve", "Working capital reserve"],

  ["lowVolume", "Low monthly volume"], ["baseVolume", "Base monthly volume"], ["highVolume", "High monthly volume"],

] as const;

type Field = typeof fields[number][0];

const money = (value: number | null | undefined, currency: string) => value == null ? "â€”" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function persist(input: ResearchInput, opportunities: ResearchOpportunity[]) {

  try { localStorage.setItem(storageKey, JSON.stringify({ input, opportunities })); } catch { /* storage unavailable */ }

}

function exportCsv(items: ResearchOpportunity[], currency: string) {

  const rows = [["Opportunity", "Category", "Strength", "Confidence", "Investment " + currency, "Base monthly profit " + currency, "Evidence count", "Sources"],

    ...items.map((item) => [item.name, item.category, item.strength ?? "Unrated", item.confidence, item.financials?.funding ?? "Unknown", item.financials?.scenarios[1].profit ?? "Unknown", item.sources.length, item.sources.map((source) => source.url).join(" ")])];

  const cell = (value: string | number) => '"' + String(value).replace(/"/g, '""') + '"';

  const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));

  const link = document.createElement("a"); link.href = url; link.download = "opportunity-research.csv"; link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

}

export function SourceDiscovery({ view = "research", onSaved: _onSaved, onError, initialTopic }: { view?: "research" | "starred" | "settings" | "profile"; onSaved: (lead: Lead) => void; onError: (message: string) => void; initialTopic?: string }) {

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

  const [selected, setSelected] = useState<string | null>(null), [compare, setCompare] = useState<string[]>([]);

  const [sort, setSort] = useState<"name" | "strength" | "investment" | "profit" | "evidence">("strength");

  const [busy, setBusy] = useState(false), [progress, setProgress] = useState("");

  const [preparedBrief, setPreparedBrief] = useState("");
  const [interpretation, setInterpretation] = useState<{ original: string; searchTerms: string; classifier: string; suggestions: { word: string; options: string[] }[] } | null>(null);
  const [providerErrors, setProviderErrors] = useState<string[]>([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

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

    if (sort === "evidence") return b.sources.length - a.sources.length;

    if (sort === "investment") return (a.financials?.funding ?? Infinity) - (b.financials?.funding ?? Infinity);

    if (sort === "profit") return (b.financials?.scenarios[1].profit ?? -Infinity) - (a.financials?.scenarios[1].profit ?? -Infinity);

    return (b.strength ?? -1) - (a.strength ?? -1) || b.sources.length - a.sources.length;

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

    setBusy(true); setProgress("Collecting sources"); setProviderErrors([]); onError("");

    try {

      const response = await fetch("/api/hunt/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next), signal: controller.signal });

      const data = await response.json() as { error?: string; query?: { brief: string; original: string; searchTerms: string; classifier: string; suggestions: { word: string; options: string[] }[] }; opportunities: ResearchOpportunity[]; providerErrors: string[] };

      if (!response.ok) throw new Error(data.error ?? "Research failed.");

      setPreparedBrief(data.query?.brief ?? ""); setInterpretation(data.query ?? null); setInput(next); setOpportunities(data.opportunities); setProviderErrors(data.providerErrors);

      setSelected(null); setCompare([]); persist(next, data.opportunities);

      setProgress(data.opportunities.length + " findings grouped and qualified");

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

      <label className="research-topic"><span className="sr-only">Topic</span><input required minLength={2} maxLength={1000} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={`e.g. ${TRENDING_PROMPTS[placeholderIndex] || "Research a business…"}`} /></label>

      <button className="hunt-icon-action" title="Research" aria-label="Research" disabled={busy} type="submit"><Search size={18} /></button>

      {busy && <button className="hunt-icon-action" type="button" title="Cancel research" aria-label="Cancel research" onClick={() => abort.current?.abort()}><Square size={14} /></button>}

    </form>

    <form hidden={view !== "profile"} className="research-personalisation" onSubmit={savePreferences} onChange={() => setPreferencesSaved(false)}>
      <label>Location<input required minLength={2} maxLength={100} value={geography} onChange={(event) => setGeography(event.target.value)} placeholder="e.g. Goa, India" /></label>

      <label>Maximum budget<input min="0" max="1000000000" type="number" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Not set" /></label>

      <select aria-label="Currency" value={currency} onChange={(event) => setCurrency(event.target.value)}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select>

      <label>Minimum investment<input type="number" min="0" max="1000000000" value={minimumInvestment} onChange={(event) => setMinimumInvestment(event.target.value)} placeholder="0" /></label>
      <button className="hunt-create-submit" type="submit">Save</button><span role="status">{preferencesSaved ? "Saved" : ""}</span>
    </form>
    {preparedBrief && view === "research" && <details className="hunt-source-caption"><summary>Search interpretation</summary><p>{interpretation?.searchTerms ?? preparedBrief}</p><small>{interpretation?.classifier}</small>
      {interpretation?.suggestions.map((suggestion, index) => <div key={index}>{suggestion.word}: {suggestion.options.map((option) => <button className="hunt-tag" disabled={busy} key={option} title={"Search with " + option} onClick={() => { const corrected = interpretation.original.replace(suggestion.word, option); setTopic(corrected); void research(null, false, corrected); }}>{option}</button>)}</div>)}
      <button className="hunt-tag" disabled={busy} onClick={() => void research(null, true, interpretation?.original)}>Search original</button></details>}
    <section hidden={view !== "settings"} className="research-filters" aria-label="Business filters"><div>

      <label>Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Software, agricultureâ€¦" /></label>

      <label>Model<input value={businessModel} onChange={(event) => setBusinessModel(event.target.value)} placeholder="Subscription, serviceâ€¦" /></label>

      <label>Customer<input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Small businessâ€¦" /></label>

      <label>Driver<input value={driver} onChange={(event) => setDriver(event.target.value)} placeholder="Workflow failureâ€¦" /></label>

    </div><label>Web sources<textarea aria-label="Web source URLs" value={sourceUrls} onChange={(event) => setSourceUrls(event.target.value)} placeholder="Up to 3 public HTTPS URLs, one per line" rows={3} /></label><small>Applies to your next search.</small></section>

    <div hidden={!progress && !providerErrors.length} className="research-status" aria-live="polite">{progress}{providerErrors.length > 0 && <span> Â· {providerErrors.join(", ")}</span>}</div>

    <div hidden={view === "settings" || view === "profile"}>

    <section hidden={!ordered.filter((item) => view !== "starred" || stars.includes(item.id)).length} className="research-results" aria-label="Ranked findings">

      <header><div><h2>Opportunity comparison</h2><small>{opportunities.length} grouped findings Â· unrated items require more evidence</small></div>

        <button className="hunt-icon-action" title="Export results CSV" aria-label="Export results CSV" disabled={!opportunities.length} onClick={() => exportCsv(compare.length ? opportunities.filter((item) => compare.includes(item.id)) : ordered, input?.currency ?? currency)}><Download size={16} /></button></header>

      <div className="hunt-table-scroll"><table><thead><tr>

        <th><button onClick={() => setSort("name")}>Opportunity</button></th><th>Category</th><th><button onClick={() => setSort("strength")}>Strength</button></th><th>Confidence</th>

        <th><button onClick={() => setSort("investment")}>Investment</button></th><th><button onClick={() => setSort("profit")}>Base profit / month</button></th>

        <th><button onClick={() => setSort("evidence")}>Sources</button></th><th>Actions</th></tr></thead><tbody>

        {ordered.filter((item) => view !== "starred" || stars.includes(item.id)).map((item) => <tr key={item.id} aria-selected={selected === item.id}>

          <td data-label="Opportunity"><button className="research-star" title={stars.includes(item.id) ? "Unstar" : "Star"} aria-label={(stars.includes(item.id) ? "Unstar " : "Star ") + item.name} aria-pressed={stars.includes(item.id)} onClick={() => toggleStar(item.id)}><Star size={16} fill={stars.includes(item.id) ? "currentColor" : "none"} /></button><button className="hunt-open" onClick={() => setSelected(selected === item.id ? null : item.id)}>{item.name}</button></td>

          <td data-label="Category">{item.category}</td><td data-label="Strength">{item.strength ?? "Unrated"}</td><td data-label="Confidence">{item.confidence}</td>

          <td data-label="Investment" className="hunt-number">{money(item.financials?.funding, input?.currency ?? currency)}</td>

          <td data-label="Profit / month" className="hunt-number">{money(item.financials?.scenarios[1].profit, input?.currency ?? currency)}</td>

          <td data-label="Sources">{item.sources.length}</td><td className="research-actions">

            <a href={item.sources[0].url} target="_blank" rel="noreferrer" title="Open first source" aria-label={"Open source for " + item.name}><ExternalLink size={15} /></a>

            <button title={compare.includes(item.id) ? "Remove from comparison" : "Add to comparison"} aria-label={(compare.includes(item.id) ? "Remove " : "Compare ") + item.name} aria-pressed={compare.includes(item.id)} onClick={() => setCompare((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}><GitCompareArrows size={15} /></button>

          </td>

        </tr>)}

      </tbody></table></div>

      {!(view === "starred" ? opportunities.filter((item) => stars.includes(item.id)).length : opportunities.length) && <p className="research-empty">{view === "starred" ? "Star results to keep them here." : "Search a market to begin."}</p>}

    </section>

    {!ordered.filter((item) => view !== "starred" || stars.includes(item.id)).length && <p className="research-empty">{view === "starred" ? "No starred results." : "Search a market to begin."}</p>}
    {compare.length > 1 && <section className="research-compare"><h3>Selected comparison</h3><Charts kind="comparison" opportunities={opportunities.filter((item) => compare.includes(item.id))} currency={input?.currency ?? currency} /></section>}

    {active && input && <article className="research-analysis" aria-label="Selected business analysis">

      <header><div><small>MARKET BRIEF Â· {active.geography}</small><h2>{active.name}</h2></div><button className="hunt-icon-action" title="Export selected finding" aria-label="Export selected finding" onClick={() => exportCsv([active], input.currency)}><Download size={16} /></button></header>

      <div className="research-figures">

        <Figure label="Strength" value={active.strength == null ? "Unrated" : active.strength + " / 100"} detail={active.factors.map((factor) => factor.name + ": " + (factor.score ?? "Unknown") + "/10").join(" Â· ")} />

        <Figure label="Initial funding" value={money(active.financials?.funding, input.currency)} detail="Setup + equipment + opening inventory + working capital reserve. Open assumption provenance below." />

        <Figure label="Base monthly profit" value={money(active.financials?.scenarios[1].profit, input.currency)} detail="(Price âˆ’ variable cost) Ã— base monthly volume âˆ’ monthly fixed cost." />

        <Figure label="Break-even" value={active.financials ? active.financials.breakEven == null ? "Not achievable" : active.financials.breakEven + " " + active.assumptions.unit + "s / month" : "Unknown"} detail="Fixed cost Ã· contribution per unit, rounded up. Nonpositive contribution has no achievable break-even." />

      </div>

      <div className="research-sections">

        <section><h3>Business</h3><dl>

          <dt>Buyer</dt><dd>{active.buyer ?? "Unknown"}</dd><dt>Recurring problem</dt><dd>{active.problem}</dd>

          <dt>Offering</dt><dd>{active.offering ?? "Unqualified"}</dd><dt>Alternatives</dt><dd>{active.alternatives.length ? active.alternatives.join(", ") : "Unknown"}</dd>

          <dt>Competitive gap</dt><dd>{active.gap ?? "Unknown"}</dd>

        </dl></section>

        <section><h3>Numbers</h3><dl>

          <dt>Price / {active.assumptions.unit}</dt><dd>{money(active.assumptions.price.value, input.currency)}</dd>

          <dt>Contribution / {active.assumptions.unit}</dt><dd>{money(active.financials?.contribution, input.currency)}</dd>

          <dt>Base volume</dt><dd>{active.assumptions.baseVolume.value ?? "Unknown"}</dd>

          <dt>Payback</dt><dd>{active.financials?.paybackMonth == null ? "Unknown" : active.financials.paybackMonth + " months"}</dd>

        </dl></section>

        <section><h3>Evidence</h3><p>{active.sources.length} source(s) Â· Confidence {active.confidence}</p>

          <p>{active.missing.join(" Â· ")}</p>

          <details><summary>Source claims and dates</summary>{active.claims.map((claim) => <div className="research-claim" key={claim.id}><p>{claim.text}</p><small>{claim.direction} Â· {claim.publishedAt?.slice(0, 10) ?? "Date missing"} Â· <a target="_blank" rel="noreferrer" href={active.sources.find((source) => source.id === claim.sourceIds[0])?.url}>{active.sources.find((source) => source.id === claim.sourceIds[0])?.provider}</a></small></div>)}</details>

          <details><summary>Source tables and offers</summary>{active.sources.filter((source) => source.facts).map((source) => <div key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><small>Collected {source.retrievedAt.slice(0, 10)} · Advertised, not verified</small>
            {!!source.facts?.products.length && <div className="hunt-table-scroll"><table><thead><tr><th>Product</th><th>Quoted price</th><th>Currency</th></tr></thead><tbody>{source.facts.products.map((product, index) => <tr key={index}><td>{product.name}</td><td>{product.price || "—"}</td><td>{product.currency || "—"}</td></tr>)}</tbody></table></div>}
            {!!source.facts?.tables.length && <div className="hunt-table-scroll"><table aria-label="Source table rows"><tbody>{source.facts.tables.map((row, index) => <tr key={index}>{row.map((cell, col) => <td key={col}>{cell}</td>)}</tr>)}</tbody></table></div>}
          </div>)}</details>
          <details><summary>Risks and contradictions</summary><p>{active.risks.join(" Â· ")}</p><p>Contradicting claims: {active.claims.filter((claim) => claim.direction === "contradicts").length}. Absence is not agreement.</p></details>

        </section>

      </div>

      <div className="research-default-charts">

        <Charts kind="scenarios" opportunity={active} currency={input.currency} />

        <Charts kind="breakEven" opportunity={active} currency={input.currency} />

      </div>

      <details className="research-more-charts"><summary>More charts</summary><div>

        <Charts kind="funding" opportunity={active} currency={input.currency} />

        <Charts kind="cashFlow" opportunity={active} currency={input.currency} />

        <Charts kind="waterfall" opportunity={active} currency={input.currency} />

        <Charts kind="heatmap" opportunity={active} currency={input.currency} />

        <Charts kind="radar" opportunity={active} currency={input.currency} />

        <Charts kind="demand" opportunity={active} currency={input.currency} />

      </div></details>

      <details className="research-method"><summary>Strength rules and assumption provenance</summary>

        <p>Strength measures evidence coverage and viability, not probability of success. Missing factors keep result Unrated.</p>

        {active.factors.map((factor) => <p key={factor.name}><b>{factor.name} Â· {factor.weight} points Â· {factor.score == null ? "Unknown" : factor.score + "/10"}</b><br />{factor.rule}

          {factor.evidenceIds.map((id) => {

            const claim = active.claims.find((item) => item.id === id);

            const source = active.sources.find((item) => item.id === claim?.sourceIds[0]);

            return source && claim ? <span key={id} className="research-factor-source"><br /><a href={source.url} target="_blank" rel="noreferrer">{source.provider} Â· {source.publishedAt.slice(0, 10)}</a>: {claim.text}</span> : null;

          })}</p>)}

        {fields.map(([field, label]) => <p key={field}><b>{label}: {active.assumptions[field].value ?? "Missing"} {active.assumptions[field].unit}</b><br />{active.assumptions[field].provenance} Â· {active.assumptions[field].geography} Â· {active.assumptions[field].date ?? "Date missing"} Â· {active.assumptions[field].note || "No rationale"}{active.assumptions[field].sourceIds.length ? " Â· Source: " + active.assumptions[field].sourceIds.join(", ") : ""}</p>)}

      </details>

      <FinancialEditor item={active} onChange={(assumptions) => updateAssumptions(active.id, assumptions)} />

    </article>}

    <p className="hunt-source-caption">Ask HN and Stack Overflow public discussions Â· maximum 40 sources per search. Discussion activity does not establish demand, local feasibility, or price.</p>
    </div>
  </section>;

}

function Figure({ label, value, detail }: { label: string; value: string; detail: string }) { return <div><small>{label}</small><strong>{value}</strong><details><summary>Calculation</summary><p>{detail}</p></details></div>; }

function FinancialEditor({ item, onChange }: { item: ResearchOpportunity; onChange: (value: FinancialAssumptions) => void }) {

  const [draft, setDraft] = useState(item.assumptions);

  useEffect(() => setDraft(item.assumptions), [item.id, item.assumptions]);

  function edit(field: Field, patch: Partial<FinancialAssumptions[Field]>) {

    setDraft((current) => ({ ...current, [field]: { ...current[field], ...patch } }));

  }

  const valid = calculateFinancials(draft) !== null;

  return <details className="research-assumptions"><summary>Model financial assumptions</summary>

    <p>Enter comparable price, costs, funding, and low/base/high monthly volumes. Each amount retains provenance and date.</p>

    <label>Sales unit<input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} /></label>

    <div className="research-assumption-grid">{fields.map(([field, label]) => <fieldset key={field}><legend>{label} Â· {draft[field].unit}</legend>

      <input aria-label={label} type="number" min="0" step={field.toLowerCase().includes("volume") ? "1" : "0.01"} placeholder="Missing" value={draft[field].value ?? ""} onChange={(event) => edit(field, { value: event.target.value === "" ? null : Number(event.target.value), provenance: event.target.value === "" ? "Missing" : "User-entered", date: event.target.value === "" ? null : new Date().toISOString().slice(0, 10) })} />

      <select aria-label={label + " provenance"} value={draft[field].provenance} onChange={(event) => edit(field, { provenance: event.target.value as Provenance })}><option>Missing</option><option>User-entered</option><option>Estimated</option><option>Sourced</option></select>

      <input aria-label={label + " date"} type="date" value={draft[field].date ?? ""} onChange={(event) => edit(field, { date: event.target.value || null })} />

      <input aria-label={label + " source or rationale"} placeholder="Source URL or rationale" value={draft[field].note} onChange={(event) => edit(field, { note: event.target.value })} />

      <select aria-label={label + " source"} value={draft[field].sourceIds[0] ?? ""} onChange={(event) => edit(field, { sourceIds: event.target.value ? [event.target.value] : [] })}><option value="">No linked source</option>{item.sources.map((source) => <option key={source.id} value={source.id}>{source.provider}: {source.title.slice(0, 50)}</option>)}</select>

    </fieldset>)}</div>

    <button className="hunt-create-submit" disabled={!valid} onClick={() => onChange(draft)}>Apply assumptions</button>

    {!valid && <small>Complete all amounts and ordered scenario volumes to calculate figures.</small>}

  </details>;

}

