import type { ResearchOpportunity } from "@/lib/research-engine";
import type { DossierReportMetadata } from "@/lib/dossier-report";

const columns = [
  "topic", "geography", "report_date", "currency", "opportunity", "category",
  "strength", "confidence", "claim_direction", "claim", "source_id", "source_provider",
  "source_title", "source_url", "source_published_at", "source_retrieved_at", "source_excerpt",
] as const;

function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  const safe = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function* evidenceCsvChunks(opportunities: ResearchOpportunity[], metadata: DossierReportMetadata): Generator<string> {
  yield `${columns.map(csvCell).join(",")}\r\n`;

  for (const opportunity of opportunities) {
    const sourceById = new Map((opportunity.sources ?? []).map((source) => [source.id, source]));
    const linkedSourceIds = new Set<string>();
    const base: (string | number)[] = [
      metadata.topic,
      metadata.geography,
      metadata.generatedDate,
      metadata.currency,
      opportunity.name,
      opportunity.category,
      opportunity.strength == null ? "" : String(opportunity.strength),
      opportunity.confidence,
    ];

    for (const claim of opportunity.claims ?? []) {
      const sources = claim.sourceIds.map((id) => sourceById.get(id)).filter((source) => source !== undefined);
      if (sources.length === 0) yield `${[...base, claim.direction, claim.text, "", "", "", "", "", "", ""].map(csvCell).join(",")}\r\n`;
      for (const source of sources) {
        linkedSourceIds.add(source.id);
        yield `${[...base, claim.direction, claim.text, source.id, source.provider, source.title, source.url, source.publishedAt, source.retrievedAt, source.excerpt].map(csvCell).join(",")}\r\n`;
      }
    }

    for (const source of opportunity.sources ?? []) {
      if (!linkedSourceIds.has(source.id)) yield `${[...base, "context", "", source.id, source.provider, source.title, source.url, source.publishedAt, source.retrievedAt, source.excerpt].map(csvCell).join(",")}\r\n`;
    }
    if (!opportunity.claims?.length && !opportunity.sources?.length) yield `${[...base, "", "", "", "", "", "", "", ""].map(csvCell).join(",")}\r\n`;
  }
}

export function createEvidenceCsv(opportunities: ResearchOpportunity[], metadata: DossierReportMetadata): string {
  return Array.from(evidenceCsvChunks(opportunities, metadata)).join("");
}
