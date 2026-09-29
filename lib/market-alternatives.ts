import type { ResearchOpportunity } from "./research-engine";
import type { CandidateAlternative } from "./collectors/github-alternatives";

const stopWords = /^(about|with|from|business|software|service|system|tools|market|research|open|source|management|platform|based|using|build|built|app|application|api)$/;
const words = (text: string) => new Set((text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).filter((word) => !stopWords.test(word)));

export function attachCandidateAlternatives(opportunities: ResearchOpportunity[], candidates: CandidateAlternative[]): ResearchOpportunity[] {
  return opportunities.map((opportunity) => {
    if (!/\b(?:software|saas|application|app|api)\b/i.test(opportunity.name + " " + opportunity.problem)) return opportunity;
    const subject = words(opportunity.name + " " + opportunity.problem);
    const matches = candidates.flatMap((candidate) => {
      const candidateWords = words(candidate.name + " " + candidate.description);
      const matchedTerms = [...candidateWords].filter((word) => subject.has(word)).sort();
      const unionSize = new Set([...subject, ...candidateWords]).size;
      const relevance = unionSize ? matchedTerms.length / unionSize : 0;
      return matchedTerms.length >= 2 && relevance >= 0.12
        ? [{ ...candidate, matchedTerms, relevance: Math.round(relevance * 100) }]
        : [];
    }).sort((a, b) => b.relevance - a.relevance || b.stars - a.stars).slice(0, 3);
    return { ...opportunity, candidateAlternatives: matches };
  });
}
