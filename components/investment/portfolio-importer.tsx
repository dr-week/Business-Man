"use client";

import { type FormEvent, useState } from "react";
import { AlertCircle, Upload } from "lucide-react";
import { portfolioSummarySchema, type PortfolioSummary } from "@/lib/investment/portfolio-contract";
import styles from "./portfolio-importer.module.scss";

const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function PortfolioImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [valuedAt, setValuedAt] = useState(localDate);
  const [sourceName, setSourceName] = useState("Brokerage export");
  const [sourceUrl, setSourceUrl] = useState("");
  const [result, setResult] = useState<PortfolioSummary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!file) return setError("Choose a CSV file first.");
    if (file.size > 500_000) return setError("CSV must be 500 KB or smaller.");
    setBusy(true);
    try {
      const response = await fetch("/api/investment-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: await file.text(), currency, valuedAt, sourceName, ...(sourceUrl ? { sourceUrl } : {}) }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Could not analyze this CSV.";
        throw new Error(message);
      }
      const parsed = portfolioSummarySchema.safeParse(data);
      if (!parsed.success) throw new Error("Analysis returned an invalid response.");
      setResult(parsed.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not analyze this CSV.");
    } finally {
      setBusy(false);
    }
  }

  return <details className={styles.panel}>
    <summary><Upload size={16} /> Analyze a portfolio CSV</summary>
    <p className={styles.intro}>Upload your holdings to calculate cost basis and price change by sector. The file is processed for this request and not saved.</p>
    <form className={styles.form} onSubmit={analyze}>
      <label>Portfolio CSV<input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} required /></label>
      <label>Currency<input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} minLength={3} maxLength={3} pattern="[A-Z]{3}" required /></label>
      <label>Prices as of<input type="date" value={valuedAt} onChange={(event) => setValuedAt(event.target.value)} required /></label>
      <label>Data source<input value={sourceName} onChange={(event) => setSourceName(event.target.value)} maxLength={120} required /></label>
      <label>Source URL (optional)<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" /></label>
      <button type="submit" disabled={busy}>{busy ? "Analyzing…" : "Analyze portfolio"}</button>
    </form>
    {error && <p className={styles.error} role="alert"><AlertCircle size={15} />{error}</p>}
    {result && <div className={styles.result} aria-live="polite">
      <p className={styles.meta}>{result.positionCount} positions · {result.source.url ? <a href={result.source.url} target="_blank" rel="noreferrer">{result.source.name}</a> : result.source.name} · valued {result.valuedAt} · {result.verification.replaceAll("_", " ")}</p>
      <div className={styles.metrics}>
        <div><small>Cost basis</small><strong>{money(result.costBasis, result.currency)}</strong></div>
        <div><small>Market value</small><strong>{money(result.marketValue, result.currency)}</strong></div>
        <div><small>Unrealized change</small><strong>{money(result.unrealizedGain, result.currency)}</strong></div>
        <div><small>Return</small><strong>{result.returnPercent === null ? "—" : `${result.returnPercent.toFixed(2)}%`}</strong></div>
      </div>
      <div className={styles.tableWrap}><table>
        <thead><tr><th>Sector</th><th>Positions</th><th>Cost basis</th><th>Market value</th><th>Change</th><th>Return</th></tr></thead>
        <tbody>{result.sectorSummary.map((sector) => <tr key={sector.sector}>
          <th scope="row">{sector.sector}</th><td>{sector.positions}</td><td>{money(sector.costBasis, result.currency)}</td><td>{money(sector.marketValue, result.currency)}</td><td>{money(sector.unrealizedGain, result.currency)}</td><td>{sector.returnPercent === null ? "—" : `${sector.returnPercent.toFixed(2)}%`}</td>
        </tr>)}</tbody>
      </table></div>
      <small className={styles.caveat}>{result.caveat}</small>
    </div>}
  </details>;
}
