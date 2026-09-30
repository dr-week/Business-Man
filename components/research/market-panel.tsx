import type { ResearchOpportunity } from "@/lib/research-engine";
import type { LocalCompetitor } from "@/lib/collectors/places";
import type { CensusMarketSignal } from "@/lib/collectors/census-market";
import { MarketFootprint } from "./market-footprint";
import { IndiaMarketContext } from "./india-market-context";

export function MarketPanel({ opportunity, competitors, placesConfigured, footprint, onOpenAnalysis }: {
  opportunity: ResearchOpportunity;
  competitors: LocalCompetitor[];
  placesConfigured: boolean;
  footprint: CensusMarketSignal | null;
  onOpenAnalysis?: () => void;
}) {
  return <div className="research-detail-modules">
    <section className="research-detail-card research-local-competition" aria-label="Local competitors">
      <h3>{competitors.length} place candidates</h3>
      {competitors.length ? <><ul>{competitors.map((place) => <li key={place.id}>
        <div><strong>{place.name}</strong><small>{place.category} · {place.address}</small></div>
        <span>{place.rating == null ? "No rating" : `${place.rating.toFixed(1)} ★ (${place.ratingCount ?? 0})`}</span>
        {place.mapUrl && <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" title={`Open ${place.name} on Google Maps`}>Map</a>}
      </li>)}</ul><small translate="no">Google Maps · candidate listings, not a market census</small></> :
        <p>{placesConfigured ? "No matching listings returned." : "Google Places is not configured."}</p>}
      {footprint && <MarketFootprint value={footprint} />}
    </section>
    {/\bindia\b/i.test(opportunity.geography) && <IndiaMarketContext />}
    <section className="research-detail-card"><h3>Alternatives</h3><dl>
      <dt>Current</dt><dd>{opportunity.alternatives.length ? opportunity.alternatives.join(", ") : "Unknown"}</dd>
      <dt>Gap</dt><dd>{opportunity.gap ?? "Unknown"}</dd>
      <dt>Open-source software candidates</dt><dd>{opportunity.candidateAlternatives?.length ? <ul>{opportunity.candidateAlternatives.map((candidate) => <li key={candidate.url}>
        <a href={candidate.url} target="_blank" rel="noopener noreferrer">{candidate.name}</a> · {candidate.stars.toLocaleString()} stars · {candidate.license ?? "License unknown"}<br />
        <small>{candidate.matchedTerms?.length ? `Matched: ${candidate.matchedTerms.join(", ")} · ${candidate.relevance}% text overlap · ` : ""}Updated {candidate.updatedAt.slice(0, 10)}</small>
      </li>)}</ul> : "No candidates found"}</dd>
    </dl><small>Listings and stars do not measure buyer demand.</small></section>
    {onOpenAnalysis && <section className="research-market-next-step" aria-labelledby="market-next-step-title">
      <div><h3 id="market-next-step-title">Check buyer evidence before investing</h3>
        <p>Listings and business counts show activity, not customer purchases. Review evidence, assumptions, and buyer checks next.</p>
      </div>
      <button className="research-submit" type="button" onClick={onOpenAnalysis}>Review evidence and buyer checks</button>
    </section>}
  </div>;
}
