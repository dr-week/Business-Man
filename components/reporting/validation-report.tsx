"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Share2 } from "lucide-react";
import { z } from "zod";

const reportSchema = z.object({
  savedResearchRuns: z.number().int().nonnegative(),
  checks: z.object({
    total: z.number().int().nonnegative(),
    outcomes: z.object({ open: z.number().int().nonnegative(), supports: z.number().int().nonnegative(), disconfirms: z.number().int().nonnegative(), inconclusive: z.number().int().nonnegative() }),
    evidenceKinds: z.object({ sourced_fact: z.number().int().nonnegative(), user_report: z.number().int().nonnegative(), estimate: z.number().int().nonnegative(), hypothesis: z.number().int().nonnegative() }),
  }),
  buyerValidation: z.object({
    pilotOffers: z.number().int().nonnegative(),
    paidPilotRecords: z.number().int().nonnegative(),
    repeatPurchases: z.number().int().nonnegative(),
    recordedAmountsByCurrency: z.array(z.object({ currency: z.string().length(3), amount: z.number().finite().nonnegative() })),
  }),
  businessmanPaymentRecords: z.array(z.object({ currency: z.string().length(3), capturedAmount: z.number().finite().nonnegative(), records: z.number().int().nonnegative() })),
  nextAction: z.object({ title: z.string(), detail: z.string() }),
  generatedAt: z.string().datetime().optional(),
  note: z.string(),
});
type Report = z.infer<typeof reportSchema>;

function createValidationBrief(report: Report) {
  const formatMoney = (amount: number, currency: string) => {
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
    catch { return `${amount.toLocaleString("en-IN")} ${currency}`; }
  };
  const amounts = (rows: { currency: string; amount: number }[]) => rows.length
    ? rows.map(({ currency, amount }) => formatMoney(amount, currency)).join(", ")
    : "None recorded";
  const receipts = report.businessmanPaymentRecords.map(({ currency, capturedAmount }) => ({ currency, amount: capturedAmount }));
  const body = [
    "# Market validation brief",
    `Generated: ${(report.generatedAt ? new Date(report.generatedAt) : new Date()).toISOString()}`,
    "",
    "## Research activity",
    `- Saved research runs: ${report.savedResearchRuns}`,
    `- Buyer checks recorded: ${report.checks.total}`,
    `- Supporting checks: ${report.checks.outcomes.supports}`,
    `- Disconfirming checks: ${report.checks.outcomes.disconfirms}`,
    `- Sourced facts: ${report.checks.evidenceKinds.sourced_fact}`,
    "",
    "## Buyer and payment signals",
    `- Pilot offers: ${report.buyerValidation.pilotOffers}`,
    `- Paid pilot records: ${report.buyerValidation.paidPilotRecords}`,
    `- Repeat purchase records: ${report.buyerValidation.repeatPurchases}`,
    `- Owner-reported opportunity payments: ${amounts(report.buyerValidation.recordedAmountsByCurrency)}`,
    `- BUSINESSman captured receipts: ${amounts(receipts)}`,
    "",
    "## Evidence limits",
    report.note,
    "Counts describe records in this workspace; they do not establish representative market demand or prove causation. Opportunity payments are owner-reported. BUSINESSman captured receipts are before refunds and provider fees.",
    "",
    "## Suggested next action",
    `- ${report.nextAction.title}: ${report.nextAction.detail}`,
    "This is a transparent follow-up prompt based on saved records, not an investment recommendation.",
  ].join("\n");
  return new File([body], `market-validation-brief-${new Date().toISOString().slice(0, 10)}.md`, { type: "text/markdown;charset=utf-8" });
}

function downloadValidationBrief(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ValidationReport() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setRefreshing(true);
    fetch("/api/reporting/validation-summary", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data: unknown = await response.json().catch(() => null);
        const errorMessage = z.object({ error: z.string() }).safeParse(data).data?.error;
        if (!response.ok) throw new Error(errorMessage ?? "Could not load validation report.");
        const parsed = reportSchema.safeParse(data);
        if (!parsed.success) throw new Error("The report returned an invalid response.");
        if (!controller.signal.aborted) setReport(parsed.data);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load validation report."); })
      .finally(() => { if (!controller.signal.aborted) setRefreshing(false); });
    return () => controller.abort();
  }, [attempt]);

  if (error && !report) return <section className="research-report-state" role="alert">
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

  async function shareBrief() {
    setShareStatus("");
    const file = createValidationBrief(report);
    if (typeof navigator.share !== "function" || !navigator.canShare?.({ files: [file] })) {
      downloadValidationBrief(file);
      setShareStatus("File sharing is unavailable here; the brief was downloaded.");
      return;
    }
    try {
      await navigator.share({ title: "Market validation brief", files: [file] });
      setShareStatus("Brief shared.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      downloadValidationBrief(file);
      setShareStatus("Sharing failed; the brief was downloaded instead.");
    }
  }

  return <section aria-label="Validation reporting">
    {error && <p className="research-report-state" role="alert">{error} Showing the last successfully loaded report.</p>}
    <div className="research-report-actions">
      <p>Share a compact snapshot of research activity, buyer checks, and payment signals. The export includes evidence limits.</p>
      <div>
        <button className="research-submit" type="button" onClick={() => setAttempt((value) => value + 1)} disabled={refreshing}><RefreshCw size={15} /> {refreshing ? "Refreshing…" : "Refresh report"}</button>{" "}
        <button className="research-submit" type="button" onClick={shareBrief}><Share2 size={15} /> Share brief</button>{" "}
        <button className="research-submit" type="button" onClick={() => downloadValidationBrief(createValidationBrief(report))}>Download brief</button>
      </div>
    </div>
    {shareStatus && <p role="status" aria-live="polite">{shareStatus}</p>}
    <div className="research-decision-strip">
      {metrics.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      <p>{report.note}</p>
    </div>
    <aside className="research-validation-next-action" aria-label="Suggested validation next action">
      <small>Suggested next action · based on recorded checks</small>
      <strong>{report.nextAction.title}</strong>
      <p>{report.nextAction.detail}</p>
      <small>This is a follow-up prompt, not an investment recommendation.</small>
    </aside>
    <details className="research-report-payment">
      <summary>Buyer validation from saved opportunities</summary>
      <div className="research-decision-strip">
        <div><strong>{report.buyerValidation.pilotOffers}</strong><span>Pilots offered</span></div>
        <div><strong>{report.buyerValidation.paidPilotRecords}</strong><span>Paid pilot records</span></div>
        <div><strong>{report.buyerValidation.repeatPurchases}</strong><span>Repeat purchase records</span></div>
        <div><strong>{report.buyerValidation.recordedAmountsByCurrency.length
          ? report.buyerValidation.recordedAmountsByCurrency.map(({ currency, amount }) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)).join(" · ")
          : "—"}</strong><span>Recorded amounts, by currency</span></div>
      </div>
      <p>These are owner-reported payments for researched opportunities, not independently verified. BUSINESSman receipts are reported separately below.</p>
    </details>
    <details className="research-report-payment">
      <summary>BUSINESSman captured receipts</summary>
      {report.businessmanPaymentRecords.length ? report.businessmanPaymentRecords.map((entry) => <p key={entry.currency}>
        <strong>{new Intl.NumberFormat(undefined, { style: "currency", currency: entry.currency, maximumFractionDigits: 0 }).format(entry.capturedAmount)}</strong>
        {" · "}{entry.records} captured payment{entry.records === 1 ? "" : "s"} · before refunds and provider fees
      </p>) : <p>No verified captured receipts recorded yet. Configure Razorpay checkout and its signed webhook to track sales.</p>}
    </details>
  </section>;
}
