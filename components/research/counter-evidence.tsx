"use client";

import { useEffect, useState } from "react";

type Check = {
  id: string;
  question: string;
  outcome: "open" | "supports" | "disconfirms" | "inconclusive";
  evidenceKind: "sourced_fact" | "user_report" | "estimate" | "hypothesis" | null;
  note: string;
  sourceTitle: string;
  sourceUrl: string;
  observedAt: string | null;
  createdAt: string;
};

const outcomeLabels = { open: "Open", supports: "Supports", disconfirms: "Disconfirms", inconclusive: "Inconclusive" } as const;

export function CounterEvidence({ runId, opportunityId }: { runId: string; opportunityId: string }) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/hunt/research-runs/${encodeURIComponent(runId)}/checks?opportunityId=${encodeURIComponent(opportunityId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { checks?: Check[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load checks.");
        setChecks(Array.isArray(data.checks) ? data.checks : []);
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load checks."); });
    return () => controller.abort();
  }, [runId, opportunityId]);

  async function addCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/hunt/research-runs/${encodeURIComponent(runId)}/checks`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, question }),
      });
      const data = await response.json() as { check?: Check; duplicate?: boolean; error?: string };
      if (!response.ok || !data.check) throw new Error(data.error ?? "Could not save check.");
      setChecks((current) => [data.check!, ...current.filter((check) => check.id !== data.check!.id)]);
      setQuestion("");
      if (data.duplicate) setMessage("That check already exists for this opportunity. Showing the saved check.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save check."); }
    finally { setBusy(false); }
  }

  async function resolveCheck(event: React.FormEvent<HTMLFormElement>, checkId: string) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(["outcome", "evidenceKind", "note", "sourceTitle", "sourceUrl", "observedAt"].map((key) => [key, form.get(key)]));
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/hunt/research-runs/${encodeURIComponent(runId)}/checks/${encodeURIComponent(checkId)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json() as { check?: Check; error?: string };
      if (!response.ok || !data.check) throw new Error(data.error ?? "Could not save outcome.");
      setChecks((current) => current.map((check) => check.id === checkId ? data.check! : check));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save outcome."); }
    finally { setBusy(false); }
  }

  return <section className="research-detail-card counter-evidence">
    <form onSubmit={addCheck}>
      <label htmlFor={`counter-question-${opportunityId}`}>What would disprove this?</label>
      <textarea id={`counter-question-${opportunityId}`} value={question} onChange={(event) => setQuestion(event.target.value)} minLength={10} maxLength={500} required rows={2} />
      <button type="submit" disabled={busy || question.trim().length < 10}>Add check</button>
    </form>
    {message && <p role="status">{message}</p>}
    {checks.length === 0 ? <p>No checks yet.</p> : <ul>{checks.map((check) => <li key={check.id}>
      <details>
        <summary>{check.question}<span>{outcomeLabels[check.outcome]}</span></summary>
        {check.outcome === "open" ? <form onSubmit={(event) => resolveCheck(event, check.id)}>
          <label>Outcome<select name="outcome" defaultValue="disconfirms"><option value="supports">Supports</option><option value="disconfirms">Disconfirms</option><option value="inconclusive">Inconclusive</option></select></label>
          <label>Evidence type<select name="evidenceKind" defaultValue="sourced_fact"><option value="sourced_fact">Sourced fact</option><option value="user_report">User report</option><option value="estimate">Estimate</option><option value="hypothesis">Hypothesis</option></select></label>
          <label>Observation<textarea name="note" minLength={5} maxLength={1000} required rows={2} /></label>
          <label>Source<input name="sourceTitle" minLength={2} maxLength={240} required /></label>
          <label>HTTPS link<input name="sourceUrl" type="url" pattern="https://.*" maxLength={2000} required /></label>
          <label>Date<input name="observedAt" type="date" max={new Date().toISOString().slice(0, 10)} required /></label>
          <button type="submit" disabled={busy}>Save outcome</button>
        </form> : <div><p>{check.note}</p><small>{check.evidenceKind?.replace("_", " ")} · {check.observedAt} · <a href={check.sourceUrl} target="_blank" rel="noreferrer">{check.sourceTitle}</a></small></div>}
      </details>
    </li>)}</ul>}
  </section>;
}
