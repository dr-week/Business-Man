"use client";

import { useEffect, useState } from "react";
import type { ResearchOpportunity } from "@/lib/research-engine";
import type { LocalCompetitor } from "@/lib/collectors/places";
import type { CensusMarketSignal } from "@/lib/collectors/census-market";
import { MarketPanel } from "./market-panel";

type MarketResult = { competitors: LocalCompetitor[]; placesConfigured: boolean; footprint: CensusMarketSignal | null; error: string | null; checkedAt: string };

export function MarketInspection({ opportunity }: { opportunity: ResearchOpportunity }) {
  const [result, setResult] = useState<MarketResult | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (attempt === null) return;
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/hunt/market", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ topic: opportunity.name, geography: opportunity.geography, industry: opportunity.category }),
    }).then(async (response) => {
      const data = await response.json().catch(() => null) as (MarketResult & { error?: string }) | null;
      if (!data) throw new Error("Market lookup returned an invalid response.");
      if (!response.ok) throw new Error(data.error || "Market lookup unavailable.");
      if (!controller.signal.aborted) { setResult(data); setError(data.error ?? ""); }
    }).catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Market lookup failed. Retry later."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [opportunity.id, opportunity.name, opportunity.geography, opportunity.category, attempt]);

  if (attempt === null) return <div className="research-empty">
    <p>Check nearby listings for this idea and location. This uses Businessman’s metered Google Places account; Google may bill the app operator per request. Cost depends on requested fields and region.</p>
    <p><a href="https://developers.google.com/maps/documentation/places/web-service/usage-and-billing" target="_blank" rel="noreferrer">Review Google Places billing and field-mask rules</a></p>
    <button className="research-submit" type="button" onClick={() => { setLoading(true); setError(""); setAttempt(0); }}>Check local listings</button>
  </div>;
  if (loading) return <div className="research-empty" role="status">Checking local market…</div>;
  if (!result) return <div className="research-empty" role="status">
    <p>{error || "Market lookup unavailable."}</p>
    <button className="research-submit" type="button" onClick={() => { setLoading(true); setError(""); setAttempt((value) => (value ?? 0) + 1); }}>Retry market check</button>
  </div>;
  return <>{error && <p role="status">{error}</p>}<MarketPanel opportunity={opportunity} competitors={result.competitors} placesConfigured={result.placesConfigured} footprint={result.footprint} checkedAt={result.checkedAt} onRefresh={() => { setError(""); setAttempt((value) => (value ?? 0) + 1); }} /></>;
}
