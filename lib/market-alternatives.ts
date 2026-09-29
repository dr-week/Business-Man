import type { ResearchOpportunity } from "./research-engine";
import type { CandidateAlternative } from "./collectors/github-alternatives";

const words = (text: string) => new Set((text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).filter((word) => !/^(about|with|from|business|software|service|system|tools|market|research)$/.test(word)));

export function attachCandidateAlternatives(opportunities: ResearchOpportunity[], candidates: CandidateAlternative[]): ResearchOpportunity[] {
  return opportunities.map((opportunity) => {
    if (!/\b(?:software|saas|application|app|api)\b/i.test(opportunity.name + " " + opportunity.problem)) return opportunity;
    const subject = words(opportunity.name + " " + opportunity.problem);
    const matches = candidates.filter((candidate) => {
      const match = [...words(candidate.name + " " + candidate.description)].filter((word) => subject.has(word));
      return match.length >= 2;
    }).slice(0, 3);
    return { ...opportunity, candidateAlternatives: matches };
  });
}
