"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SourceDiscovery } from "@/components/source-discovery";
import "../hunt.css";
import { OpportunityEconomics } from "@/components/opportunity-economics";
import { calculateEconomics, inr, type Economics } from "@/lib/economics";
import { ArrowLeft, Bookmark, CheckCircle2, Coins, Crown, ExternalLink, Eye, FlaskConical, Layers, Plus, Radio, Search, ShieldAlert, ShieldCheck, Sparkles, User, X, RefreshCw } from "lucide-react";
import { LANES, SEED_LEADS, nextGate, type HuntEvidence, type Lane, type Lead } from "@/lib/opportunity-hunt";

const LEGACY_KEY = "businessman.hunt.leads.v1";
const blankLead = { title: "", lane: "Workflow failure" as Lane, failure: "", buyer: "", trigger: "", source: "", alternatives: "", payment: "", nextTest: "" };
const blankEvidence = { claim: "", sourceTitle: "", sourceUrl: "", kind: "official" as HuntEvidence["kind"], direction: "supports" as HuntEvidence["direction"], observedAt: "" };

const SOURCE_SHELF = [
  { name: "PMEGP project reports", url: "https://www.kviconline.gov.in/pmegp/pmegpweb/docs/jsp/newprojectReports.jsp", use: "Project models" },
  { name: "myScheme", url: "https://www.myscheme.gov.in/", use: "Eligibility" },
  { name: "NSIC profiles", url: "https://www.nsic.co.in/Info/ProjectProfiles", use: "Small industries" },
  { name: "India TradeStat", url: "https://tradestat.commerce.gov.in/meidb/commodity_wise_all_countries_import", use: "Import signals" },
  { name: "ICAR–CCARI Goa", url: "https://ccari.res.in/", use: "Local crop research" },
  { name: "MNRE biogas", url: "https://mnre.gov.in/en/bio-gas/", use: "Approved models" },
] as const;

function isSeed(id: string): boolean { return SEED_LEADS.some((lead) => lead.id === id); }

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

function legacyDrafts(): Lead[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LEGACY_KEY) ?? "[]") as unknown;
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is Lead => {
      if (!item || typeof item !== "object" || typeof item.title !== "string" || typeof item.failure !== "string") return false;
      const seed = SEED_LEADS.find((lead) => lead.id === item.id);
      return !seed || ["title", "failure", "buyer", "trigger", "source", "alternatives", "payment", "nextTest"].some((key) => item[key] !== seed[key as keyof Lead]);
    });
  } catch { return []; }
}

export default function HuntPage() {
  const [saved, setSaved] = useState<Lead[]>([]);
  const [evidenceState, setEvidenceState] = useState<{ leadId: string; items: HuntEvidence[] }>({ leadId: "", items: [] });
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState<Lane | "All">("All");
  const [form, setForm] = useState(blankLead);
  const [proof, setProof] = useState(blankEvidence);
  const [adding, setAdding] = useState(false);
  const [addingProof, setAddingProof] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [legacyCount, setLegacyCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"Saved" | "Research" | "Sources">("Research");

  const all = saved;
  const visible = useMemo(() => all.filter((lead) =>
    view === "Saved" &&
    (lane === "All" || lead.lane === lane) &&
    `${lead.title} ${lead.failure} ${lead.buyer} ${lead.trigger}`.toLowerCase().includes(query.toLowerCase()),
  ), [all, lane, query, view]);
  const selected = visible.find((lead) => lead.id === selectedId) ?? visible[0] ?? all[0];
  const example = false;
  const evidence = evidenceState.leadId === selected?.id ? evidenceState.items : [];

  function selectLead(id: string) {
    setSelectedId(id);
    setAdding(false);
    setAddingProof(false);
    setProof(blankEvidence);
  }

  async function refreshResearch() {
    if (refreshing) return;
    setRefreshing(true);
    setStatus("");
    try {
      const { leads } = await jsonRequest<{ leads: Lead[] }>("/api/hunt/leads", { cache: "no-store" });
      setSaved(leads);
      setLegacyCount(legacyDrafts().length);
      setLoaded(true);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setRefreshing(false);
    }
  }



  useEffect(() => {
    if (!selectedId || isSeed(selectedId)) return;
    const controller = new AbortController();
    let active = true;
    jsonRequest<{ evidence: HuntEvidence[] }>(`/api/hunt/leads/${encodeURIComponent(selectedId)}/evidence`, { signal: controller.signal })
      .then(({ evidence }) => { if (active) setEvidenceState({ leadId: selectedId, items: evidence }); })
      .catch((error: Error) => { if (active) setStatus(error.message); });
    return () => { active = false; controller.abort(); };
  }, [selectedId]);

  async function createLead(values: typeof blankLead) {
    const { lead } = await jsonRequest<{ lead: Lead }>("/api/hunt/leads", { method: "POST", body: JSON.stringify(values) });
    setSaved((current) => [lead, ...current]);
    setLoaded(true);
    setView("Saved");
    setLane("All");
    setQuery("");
    selectLead(lead.id);
    setStatus("");
    return lead;
  }

  async function addLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await createLead(form); setForm(blankLead); setAdding(false); }
    catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }

  async function updateLead(field: keyof Lead, value: string) {
    if (!selected || selected[field] === value) return;
    try {
      const { lead } = await jsonRequest<{ lead: Lead }>(`/api/hunt/leads/${encodeURIComponent(selected.id)}`, {
        method: "PATCH", body: JSON.stringify({ [field]: value }),
      });
      setSaved((current) => current.map((item) => item.id === lead.id ? lead : item));
      setStatus("");
    } catch (error) { setStatus((error as Error).message); }
  }

  async function saveEconomics(economics: Economics) {
    if (!selected) return;
    const { lead } = await jsonRequest<{ lead: Lead }>(`/api/hunt/leads/${encodeURIComponent(selected.id)}`, { method: "PATCH", body: JSON.stringify({ economics }) });
    setSaved((current) => current.map((item) => item.id === lead.id ? lead : item));
  }

  async function addEvidence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    try {
      const { evidence: item } = await jsonRequest<{ evidence: HuntEvidence }>(`/api/hunt/leads/${encodeURIComponent(selected.id)}/evidence`, {
        method: "POST", body: JSON.stringify(proof),
      });
      setEvidenceState((current) => ({ leadId: selected.id, items: [item, ...(current.leadId === selected.id ? current.items : [])] }));
      setProof(blankEvidence);
      setAddingProof(false);
      setStatus("");
    } catch (error) { setStatus((error as Error).message); }
    finally { setBusy(false); }
  }

  async function importDrafts() {
    const drafts = legacyDrafts();
    if (!drafts.length || busy) return;
    setBusy(true);
    let imported = 0;
    try {
      for (const draft of drafts) {
        await createLead(draft);
        imported += 1;
        const remaining = drafts.slice(imported);
        window.localStorage.setItem(LEGACY_KEY, JSON.stringify(remaining));
        setLegacyCount(remaining.length);
      }
      window.localStorage.removeItem(LEGACY_KEY);
      setLegacyCount(0);
      setStatus(`${imported} browser drafts imported.`);
    } catch (error) { setStatus(`${imported} imported. ${String((error as Error).message)}`); }
    finally { setBusy(false); }
  }

  return <main className="hunt-page">
    <header className="hunt-app-header">
      <div className="hunt-brand"><Crown size={20} /><strong>Businessman</strong></div>
      <nav aria-label="Main navigation">
        {([{ id: "Saved", label: "Opportunities", icon: Bookmark }, { id: "Research", label: "Research", icon: Search }, { id: "Sources", label: "Sources", icon: ExternalLink }] as const).map(({ id, label, icon: Icon }) =>
          <button key={id} title={label} aria-label={label} aria-current={view === id ? "page" : undefined} onClick={() => { setView(id); setSelectedId(""); setAdding(false); setQuery(""); setLane("All"); }}><Icon size={18} /></button>)}
      </nav>
    </header>
    <div className="hunt-main">
    <div className="hunt-heading">
      <h1>{view === "Sources" ? "Sources" : view === "Research" ? "Research" : "Opportunities"}</h1>
      <div className="hunt-heading-actions">
        {view === "Saved" && <button className="hunt-icon-action" title={adding ? "Close form" : "Add opportunity"} aria-label={adding ? "Close form" : "Add opportunity"} onClick={() => { setAdding(!adding); setSelectedId(""); }}>{adding ? <X size={18} /> : <Plus size={18} />}</button>}
        <button className="hunt-icon-action" title="Reload saved research" aria-label="Reload saved research" onClick={refreshResearch} disabled={refreshing}><RefreshCw size={18} /></button>
      </div>
    </div>
    {status && <div className="hunt-status" role="status">{status}{status.includes("Sign in") && <> <Link href="/signin-with-chatgpt?return_to=%2Fhunt">Sign in</Link></>}</div>}
    {view === "Research" ? <SourceDiscovery onError={setStatus} onSaved={(lead) => { setSaved((current) => [lead, ...current.filter((item) => item.id !== lead.id)]); setLoaded(true); }} /> : view === "Sources" ? <section className="hunt-source-page" aria-label="Research sources">
      <div className="hunt-source-grid">{SOURCE_SHELF.map((item) =>
        <a key={item.url} href={item.url} target="_blank" rel="noreferrer"><strong>{item.name}</strong><span>{item.use} <ExternalLink size={10} /></span></a>)}</div>

    </section> : <>
    {legacyCount > 0 && <button className="hunt-import" onClick={importDrafts} disabled={busy}>Import {legacyCount} browser drafts</button>}
    {adding && <form className="hunt-form" onSubmit={addLead}>
      <label>Problem<input required minLength={3} autoFocus placeholder="e.g. Orders arrive late" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label className="hunt-wide">What goes wrong?<textarea required minLength={8} placeholder="Describe one real, repeated problem." value={form.failure} onChange={(event) => setForm({ ...form, failure: event.target.value })} /></label>
      <button className="hunt-create-submit" disabled={busy} type="submit">Create</button>
    </form>}
    {!adding && !selectedId && <section className="hunt-comparison" aria-label="Opportunity comparison">
      <div className="hunt-controls">
        <label className="hunt-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search opportunities" /></label>
        <select className="hunt-category" aria-label="Category" value={lane} onChange={(event) => setLane(event.target.value as Lane | "All")}><option value="All">All categories</option>{LANES.map((item) => <option key={item}>{item}</option>)}</select>
        <span className="hunt-result-count">{view === "Saved" && !loaded ? "—" : visible.length}</span>
      </div>
      {visible.length > 0 ? <div className="hunt-table-scroll"><table>
        <thead><tr><th>Opportunity</th><th>Buyer</th><th>Payment evidence</th><th>Next check</th><th>Startup cost</th><th>Monthly profit</th></tr></thead>
        <tbody>{visible.map((lead) => <tr key={lead.id}>
          <td><button className="hunt-open" onClick={() => selectLead(lead.id)}>{lead.title}</button><small>{lead.lane}</small></td>
          <td>{lead.buyer || "Unknown"}</td><td>{lead.payment || "Unknown"}</td><td><span className="hunt-tag">{nextGate(lead)}</span></td><td className="hunt-number">{lead.economics?.investment != null ? inr(lead.economics.investment) : "Unknown"}</td><td className="hunt-number">{lead.economics && calculateEconomics(lead.economics) ? <>{inr(calculateEconomics(lead.economics)!.profit)}<small>Scenario</small></> : "Unknown"}</td>
        </tr>)}</tbody>
      </table></div> : <div className="hunt-empty">
        <Bookmark size={28} /><p>{query || lane !== "All" ? "No matches" : !loaded && view === "Saved" ? "Refresh to load" : "No opportunities"}</p>
      </div>}

    </section>}
    {!adding && selectedId && selected && <section className="hunt-dossier" aria-label="Opportunity details">
        <button className="hunt-back" title="Back" aria-label="Back" onClick={() => setSelectedId("")}><ArrowLeft size={18} /></button>
        <div className="hunt-dossier-head"><h2>{selected.title}</h2><p>{selected.failure}</p>
        </div>
        <OpportunityEconomics key={selected.id} initial={selected.economics} example={example} onSave={saveEconomics} />
        <div className="hunt-next-test"><FlaskConical size={18} /><div><small>NEXT TEST</small><p>{selected.nextTest || "Define one buyer test."}</p></div></div>
        {!example && (
          <div className="hunt-decisions" aria-label="Research decision">
            <button title="Investigate" aria-label="Investigate" className={selected.decision === "Investigate" ? "is-active" : ""} onClick={() => updateLead("decision", "Investigate")}>
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span className="sr-only">Investigate</span>
            </button>
            <button title="Watch" aria-label="Watch" className={selected.decision === "Watch" ? "is-active" : ""} onClick={() => updateLead("decision", "Watch")}>
              <Eye size={13} className="text-amber-500" />
              <span className="sr-only">Watch</span>
            </button>
            <button title="Reject" aria-label="Reject" className={selected.decision === "Reject" ? "is-active" : ""} onClick={() => updateLead("decision", "Reject")}>
              <ShieldAlert size={13} className="text-red-500" />
              <span className="sr-only">Reject</span>
            </button>
          </div>
        )}
        <details className="hunt-data-section" key={selected.id + "-case"}>
          <summary><User size={15} /> <span>Case</span></summary>
          <div className="hunt-fields">
            <EditField key={`${selected.id}-buyer`} label="Buyer" icon={User} value={selected.buyer} onSave={(value) => updateLead("buyer", value)} readOnly={example} hint="Buyer" />
            <EditField key={`${selected.id}-trigger`} label="Trigger" icon={Sparkles} value={selected.trigger} onSave={(value) => updateLead("trigger", value)} readOnly={example} hint="Trigger" />
            <EditField key={`${selected.id}-source`} label="Signal" icon={Radio} value={selected.source} onSave={(value) => updateLead("source", value)} readOnly={example} hint="Signal" />
            <EditField key={`${selected.id}-alternatives`} label="Alternatives" icon={Layers} value={selected.alternatives} onSave={(value) => updateLead("alternatives", value)} readOnly={example} hint="Alternatives" />
            <EditField key={`${selected.id}-payment`} label="Payment" icon={Coins} value={selected.payment} onSave={(value) => updateLead("payment", value)} readOnly={example} hint="Payment" />
            <EditField key={`${selected.id}-nextTest`} label="Test" icon={FlaskConical} value={selected.nextTest} onSave={(value) => updateLead("nextTest", value)} readOnly={example} hint="Next test" />
          </div>
        </details>
        {!example && <details className="hunt-data-section hunt-proof-section" key={selected.id + "-proof"}>
          <summary><ShieldCheck size={15} /><span>Evidence</span><b>{evidence.length}</b></summary>
          <button className="hunt-icon-action hunt-evidence-add" title="Add evidence" aria-label="Add evidence" onClick={() => setAddingProof((value) => !value)}><Plus size={15} /></button>
          {addingProof && <form className="hunt-proof-form" onSubmit={addEvidence}>
            <input required minLength={5} aria-label="Claim or finding" placeholder="Claim or finding" value={proof.claim} onChange={(event) => setProof({ ...proof, claim: event.target.value })} />
            <input required minLength={2} aria-label="Source name" placeholder="Source name" value={proof.sourceTitle} onChange={(event) => setProof({ ...proof, sourceTitle: event.target.value })} />
            <input type="url" aria-label="Source URL" placeholder="Source URL (if public)" value={proof.sourceUrl} onChange={(event) => setProof({ ...proof, sourceUrl: event.target.value })} />
            <div className="hunt-proof-options"><select aria-label="Source type" value={proof.kind} onChange={(event) => setProof({ ...proof, kind: event.target.value as HuntEvidence["kind"] })}><option value="official">Official</option><option value="buyer">Buyer</option><option value="field">Field</option><option value="supplier">Supplier</option><option value="other">Other</option></select>
              <select aria-label="Evidence direction" value={proof.direction} onChange={(event) => setProof({ ...proof, direction: event.target.value as HuntEvidence["direction"] })}><option value="supports">Supports</option><option value="contradicts">Contradicts</option><option value="context">Context</option></select>
              <input aria-label="Observation date" type="date" required value={proof.observedAt} onChange={(event) => setProof({ ...proof, observedAt: event.target.value })} /></div>
            <button className="hunt-primary hunt-submit-icon" title="Save evidence" aria-label="Save evidence" disabled={busy} type="submit"><CheckCircle2 size={16} /></button>
          </form>}
          {evidence.map((item) => <div className="hunt-evidence" key={item.id}><span className={`hunt-direction hunt-${item.direction}`}>{item.direction}</span><p>{item.claim}</p><small>{item.kind} · {item.observedAt} · {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceTitle} <ExternalLink size={10} /></a> : item.sourceTitle}</small></div>)}
        </details>}
      </section>}
    </>}
    </div>
  </main>;
}

function EditField({ label, value, onSave, readOnly, hint, icon: Icon }: { label: string; value: string; onSave: (value: string) => void; readOnly: boolean; hint: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  const [draft, setDraft] = useState(value);
  return (
    <label className="hunt-field">
      <span className="flex items-center gap-1.5 font-medium">
        {Icon && <Icon size={12} className="text-[#c2a663]" />}
        {label}
      </span>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onSave(draft)} readOnly={readOnly} placeholder={hint} rows={2} />
    </label>
  );
}






