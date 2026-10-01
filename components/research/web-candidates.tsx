import { ExternalLink } from "lucide-react";
import type { WebResearchResult } from "@/lib/collectors/brave-search";

export function WebCandidates({ results, configured }: { results: WebResearchResult[]; configured: boolean }) {
  const literature = results.filter((result) => result.kind === "academic");
  const webResults = results.filter((result) => result.kind !== "academic");
  return <details className="research-web-module">
    <summary>Research links · {results.length}</summary>
    {webResults.length > 0 && <section aria-label="Web search results">
      <h3>Web leads · {webResults.length}</h3>
      <ul>{webResults.map((result) => <li key={result.url}><a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}<ExternalLink size={13} /></a>{result.snippet && <p>{result.snippet}</p>}</li>)}</ul>
    </section>}
    {!configured && <p>Web search needs a Brave API key.</p>}
    {literature.length > 0 && <section aria-label="Academic literature">
      <h3>Academic literature · {literature.length}</h3>
      <ul>{literature.map((result) => <li key={result.url}><a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}<ExternalLink size={13} /></a>{result.snippet && <p>{result.snippet}</p>}</li>)}</ul>
      <small>Background research only. Papers and citation counts do not establish local buyer demand.</small>
    </section>}
    {results.length === 0 && configured && <p>No research links found.</p>}
    <small>Candidate links only; not included in opportunity evidence or scores.</small>
  </details>;
}
