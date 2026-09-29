import { buildValidationPlan, type ValidationAction } from "./validation-plan";
import type { SourceSignal } from "./discovery";
import type { Claim } from "./research-engine";

export type CounterClaim = {
  id: string;
  text: string;
  basis: string;
  source: string;
  sourceUrl: string | null;
  publishedAt: string | null;
};

export type CounterEvidence = { claims: CounterClaim[]; checks: ValidationAction[] };

function sourceType(source: SourceSignal): string {
  if (source.kind === "buyer") return "Buyer report";
  if (source.kind === "official") return "Official source";
  if (source.kind === "supplier") return "Supplier source";
  if (source.kind === "discussion") return "Discussion";
  return "Source type unknown";
}

/** Show only sourced contradictions; validation checks remain prompts, not findings. */
export function buildCounterEvidence(claims: Claim[], sources: SourceSignal[], missing: string[]): CounterEvidence {
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const contradictions = claims.filter((claim) => claim.direction === "contradicts");
  return {
    claims: contradictions.map((claim) => {
      const source = claim.sourceIds.map((id) => sourcesById.get(id)).find(Boolean);
      let sourceUrl: string | null = null;
      try {
        const url = new URL(source?.url ?? "");
        if (url.protocol === "https:" && !url.username && !url.password) sourceUrl = url.toString();
      } catch { /* Keep an invalid or missing source visible without making it clickable. */ }
      return {
        id: claim.id,
        text: claim.text,
        basis: claim.basis ?? "Basis not classified",
        source: source ? `${source.provider} · ${sourceType(source)}` : "Source not linked",
        sourceUrl,
        publishedAt: claim.publishedAt ?? source?.publishedAt ?? null,
      };
    }),
    checks: buildValidationPlan(missing),
  };
}
