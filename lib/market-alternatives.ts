import type { ResearchOpportunity } from "./research-engine";
import type { CandidateAlternative } from "./collectors/github-alternatives";

const stopWords = /^(about|with|from|business|software|service|system|tools|market|research|open|source|management|platform|based|using|build|built|app|application|api)$/;
const words = (text: string) => new Set((text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).filter((word) => !stopWords.test(word)));

function repositoryKey(value: string): string | null {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\.git\/?$/i, "").replace(/\/+$/, "").toLowerCase();
    return url.protocol === "https:" && url.hostname.toLowerCase() === "github.com" && /^\/[^/]+\/[^/]+$/.test(path)
      ? path
      : null;
  } catch { return null; }
}

function uniqueRepositories(candidates: CandidateAlternative[]): CandidateAlternative[] {
  const unique = new Map<string, CandidateAlternative>();
  for (const candidate of candidates) {
    const key = repositoryKey(candidate.url);
    if (!key) continue;
    const current = unique.get(key);
    const candidateDate = Date.parse(candidate.pushedAt);
    const currentDate = current ? Date.parse(current.pushedAt) : Number.NEGATIVE_INFINITY;
    const candidateTime = Number.isFinite(candidateDate) ? candidateDate : Number.NEGATIVE_INFINITY;
    const currentTime = Number.isFinite(currentDate) ? currentDate : Number.NEGATIVE_INFINITY;
    if (!current || candidateTime > currentTime || (candidateTime === currentTime && candidate.stars > current.stars)) unique.set(key, candidate);
  }
  return [...unique.values()];
}

export function attachCandidateAlternatives(opportunities: ResearchOpportunity[], candidates: CandidateAlternative[]): ResearchOpportunity[] {
  const repositories = uniqueRepositories(candidates);
  return opportunities.map((opportunity) => {
    if (!/\b(?:software|saas|application|app|api)\b/i.test(opportunity.name + " " + opportunity.problem)) return opportunity;
    const subject = words(opportunity.name + " " + opportunity.problem);
    const matches = repositories.flatMap((candidate) => {
      const candidateWords = words(candidate.name + " " + candidate.description);
      const matchedTerms = [...candidateWords].filter((word) => subject.has(word)).sort();
      const unionSize = new Set([...subject, ...candidateWords]).size;
      const relevance = unionSize ? matchedTerms.length / unionSize : 0;
      return matchedTerms.length >= 2 && relevance >= 0.12
        ? [{ ...candidate, matchedTerms, relevance: Math.round(relevance * 100) }]
        : [];
    }).sort((a, b) => b.relevance - a.relevance || Date.parse(b.pushedAt) - Date.parse(a.pushedAt) || b.stars - a.stars).slice(0, 3);
    return { ...opportunity, candidateAlternatives: matches };
  });
}
