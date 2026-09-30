import { test } from "vitest";
import { parseResearchBackup } from "./research-run-store";

const source = (id: number) => ({
  id: `source-${id}`, provider: "Buyer interview", kind: "buyer", title: `Buyer conversation ${id}`,
  excerpt: "Describes current workflow and recent purchase.", url: `https://research.example/sources/${id}`,
  publishedAt: "2026-09-20T10:00:00.000Z", retrievedAt: "2026-09-30T10:00:00.000Z",
});
const backup = {
  format: "businessman-research-run", formatVersion: 1, exportedAt: "2026-09-30T10:00:00.000Z",
  run: {
    schemaVersion: 1, topic: "Local business services", geography: "Goa, India", currency: "INR",
    createdAt: "2026-09-30T10:00:00.000Z",
    input: { topic: "Local business services", geography: "Goa, India", currency: "INR", budget: null },
    result: {
      opportunities: Array.from({ length: 50 }, (_, opportunityIndex) => {
        const sources = Array.from({ length: 4 }, (_, sourceIndex) => source(opportunityIndex * 4 + sourceIndex));
        const claims = sources.map((item, index) => ({
          id: `claim-${opportunityIndex}-${index}`, text: "Buyer describes a recurring service issue.",
          direction: "context", sourceIds: [item.id],
        }));
        return {
          id: `opportunity-${opportunityIndex}`, name: `Local service ${opportunityIndex}`, category: "Services",
          geography: "Goa, India", buyer: "Independent operators", problem: "A recurring service issue",
          offering: "A managed local service", alternatives: ["Manual workaround"], gap: "No local specialist",
          risks: ["Buyer demand needs confirmation"], sources, claims, assumptions: {}, strength: null, confidence: "Low",
          factors: [{ name: "Paid demand", weight: 25, score: null, evidenceIds: claims.map((item) => item.id), rule: "Requires paid-buyer evidence." }],
          financials: null, missing: ["Paid demand"],
        };
      }),
      webResearch: Array.from({ length: 8 }, (_, index) => ({ title: `Candidate ${index}`, url: `https://market.example/${index}`, snippet: "Unreviewed lead." })),
      webSearchConfigured: true,
    },
  },
};

test("parses a 50-opportunity, source-linked backup", async ({ bench }) => {
  await bench("parse backup", () => parseResearchBackup(backup, "benchmark-owner")).run();
});
