import { ExternalLink } from "lucide-react";
import type { WebResearchResult } from "@/lib/collectors/brave-search";

export function WebCandidates({ results, configured }: { results: WebResearchResult[]; configured: boolean }) {
  return <details className="research-web-module">
    <summary>Web leads · {configured ? results.length : "off"}</summary>
    {results.length ? <ul>{results.map((result) => <li key={result.url}><a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}<ExternalLink size={13} /></a>{result.snippet && <p>{result.snippet}</p>}</li>)}</ul> : <p>{configured ? "No web leads found." : "Web search needs a Brave API key."}</p>}
    <small>Discovery links only. Excluded from evidence scores and saved results.</small>
  </details>;
}
