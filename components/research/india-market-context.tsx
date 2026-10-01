"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

const metricSchema = z.object({
  label: z.string(), value: z.number().finite().nullable(), year: z.number().int().nullable(), sourceUrl: z.string().url(),
});
const contextSchema = z.object({
  retrievedAt: z.string().datetime(),
  cacheStatus: z.enum(["fresh", "stale"]),
  metrics: z.object({ gdpCurrentUsd: metricSchema, internetUsersPercent: metricSchema, fdiNetInflowsUsd: metricSchema, lendingRatePercent: metricSchema }),
  caveat: z.string(),
});
type Context = z.infer<typeof contextSchema>;

export function IndiaMarketContext({ mode = "all" }: { mode?: "all" | "lending" }) {
  const [context, setContext] = useState<Context | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setContext(null);
    setError(false);
    fetch("/api/market-research", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        const parsed = contextSchema.safeParse(data);
        if (!response.ok || !parsed.success) throw new Error("Market context unavailable.");
        if (!controller.signal.aborted) setContext(parsed.data);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  const heading = mode === "lending" ? "Borrowing context · World Bank" : "India context · World Bank";
  if (error) return <aside className="india-market-context" aria-label={heading}><strong>Context unavailable</strong><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></aside>;
  if (!context) return <aside className="india-market-context" aria-label={heading} role="status">Loading national context…</aside>;

  const gdp = context.metrics.gdpCurrentUsd;
  const internet = context.metrics.internetUsersPercent;
  const fdi = context.metrics.fdiNetInflowsUsd;
  const lendingRate = context.metrics.lendingRatePercent;
  return <aside className="india-market-context" aria-label={heading}>
    <h3>{heading}</h3>
    {mode === "lending" ? <a href={lendingRate.sourceUrl} target="_blank" rel="noreferrer"><strong>{lendingRate.value == null ? "No current value" : `${lendingRate.value}%`}</strong><span>Annual bank lending rate · {lendingRate.year ?? "year unavailable"} ↗</span></a> : <div>
      <a href={gdp.sourceUrl} target="_blank" rel="noreferrer"><strong>{gdp.value == null ? "No current value" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(gdp.value)}</strong><span>GDP · {gdp.year ?? "year unavailable"} ↗</span></a>
      <a href={internet.sourceUrl} target="_blank" rel="noreferrer"><strong>{internet.value == null ? "No current value" : `${internet.value}%`}</strong><span>Internet users · {internet.year ?? "year unavailable"} ↗</span></a>
      <a href={fdi.sourceUrl} target="_blank" rel="noreferrer"><strong>{fdi.value == null ? "No current value" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(fdi.value)}</strong><span>Net FDI inflows · {fdi.year ?? "year unavailable"} ↗</span></a>
      <a href={lendingRate.sourceUrl} target="_blank" rel="noreferrer"><strong>{lendingRate.value == null ? "No current value" : `${lendingRate.value}%`}</strong><span>Bank lending rate · {lendingRate.year ?? "year unavailable"} ↗</span></a>
    </div>}
    <small>{context.cacheStatus === "stale" ? "World Bank unavailable · showing last successful snapshot from " : "World Bank data retrieved "}{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(context.retrievedAt))}. {context.caveat}</small>
  </aside>;
}
