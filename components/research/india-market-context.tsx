"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

const metricSchema = z.object({
  label: z.string(), value: z.number().finite().nullable(), year: z.number().int().nullable(), sourceUrl: z.string().url(),
});
const contextSchema = z.object({
  metrics: z.object({ gdpCurrentUsd: metricSchema, internetUsersPercent: metricSchema, fdiNetInflowsUsd: metricSchema }),
  caveat: z.string(),
});
type Context = z.infer<typeof contextSchema>;

export function IndiaMarketContext() {
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

  if (error) return <aside className="india-market-context" aria-label="India market context"><strong>India context unavailable</strong><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></aside>;
  if (!context) return <aside className="india-market-context" aria-label="India market context" role="status">Loading national market context…</aside>;

  const gdp = context.metrics.gdpCurrentUsd;
  const internet = context.metrics.internetUsersPercent;
  const fdi = context.metrics.fdiNetInflowsUsd;
  return <aside className="india-market-context" aria-label="India market context">
    <h3>India context · World Bank</h3>
    <div>
      <a href={gdp.sourceUrl} target="_blank" rel="noreferrer"><strong>{gdp.value == null ? "No current value" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(gdp.value)}</strong><span>GDP · {gdp.year ?? "year unavailable"} ↗</span></a>
      <a href={internet.sourceUrl} target="_blank" rel="noreferrer"><strong>{internet.value == null ? "No current value" : `${internet.value}%`}</strong><span>Internet users · {internet.year ?? "year unavailable"} ↗</span></a>
      <a href={fdi.sourceUrl} target="_blank" rel="noreferrer"><strong>{fdi.value == null ? "No current value" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(fdi.value)}</strong><span>Net FDI inflows · {fdi.year ?? "year unavailable"} ↗</span></a>
    </div>
    <small>{context.caveat}</small>
  </aside>;
}
