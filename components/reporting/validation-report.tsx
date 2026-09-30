"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

const reportSchema = z.object({
  savedResearchRuns: z.number().int().nonnegative(),
  checks: z.object({
    total: z.number().int().nonnegative(),
    outcomes: z.object({ open: z.number().int().nonnegative(), supports: z.number().int().nonnegative(), disconfirms: z.number().int().nonnegative(), inconclusive: z.number().int().nonnegative() }),
    evidenceKinds: z.object({ sourced_fact: z.number().int().nonnegative(), user_report: z.number().int().nonnegative(), estimate: z.number().int().nonnegative(), hypothesis: z.number().int().nonnegative() }),
  }),
  note: z.string(),
});
type Report = z.infer<typeof reportSchema>;

export function ValidationReport() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setReport(null);
    setError("");
    fetch("/api/reporting/validation-summary", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "Could not load validation report.");
        const parsed = reportSchema.safeParse(data);
        if (!parsed.success) throw new Error("The report returned an invalid response.");
        if (!controller.signal.aborted) setReport(parsed.data);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load validation report."); });
    return () => controller.abort();
  }, [attempt]);

  if (error) return <section className="research-report-state" role="alert">
    <p>{error}</p>
    {error.includes("Sign in") && <a href="/signin-with-chatgpt?return_to=%2Fhunt">Sign in</a>}
    <button className="research-submit" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry report</button>
  </section>;
  if (!report) return <p className="research-empty" role="status">Loading your validation report…</p>;

  const metrics = [
    ["Saved research runs", report.savedResearchRuns],
    ["Buyer checks", report.checks.total],
    ["Disconfirmed", report.checks.outcomes.disconfirms],
    ["Sourced facts", report.checks.evidenceKinds.sourced_fact],
  ] as const;

  return <section aria-label="Validation reporting">
    <div className="research-decision-strip">
      {metrics.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      <p>{report.note}</p>
    </div>
    <p className="research-report-payment">Payment tracking: not connected. These counts do not prove willingness to pay.</p>
  </section>;
}
