import type { ResearchOpportunity } from "@/lib/research-engine";
import { independentSourceCount } from "@/lib/evidence-lineage";

export interface DossierReportMetadata {
  title: string;
  topic: string;
  geography: string;
  generatedDate: string;
  currency: string;
  opportunitiesCount: number;
}

export function generateExecutiveDossierMarkdown(
  items: ResearchOpportunity[],
  metadata: DossierReportMetadata
): string {
  const lines: string[] = [];

  lines.push("# BUSINESSMAN INTELLIGENCE DESK");
  lines.push(`## EXECUTIVE MARKET DOSSIER: ${metadata.topic.toUpperCase()}`);
  lines.push(`*Confidential Research Briefing · Date: ${metadata.generatedDate} · Geography: ${metadata.geography}*`);
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("### 1. EXECUTIVE SUMMARY & STRATEGIC THESIS");
  lines.push(
    `This intelligence dossier examines market opportunities in **${metadata.topic}** across **${metadata.geography}**. ` +
    `This report contains **${items.length} candidate opportunities**. Scores and financial scenarios are screening outputs based on available inputs; ` +
    `they do not establish demand, validate claims, or forecast actual results.`
  );
  lines.push("");
  lines.push("**Key Decision Takeaway:**");
  lines.push(
    "- Treat each opportunity as a hypothesis until buyers demonstrate a concrete commitment.\n" +
    "- Use the next validation action below to replace assumptions with dated, local evidence before committing capital."
  );
  lines.push("");

  lines.push("### 2. OPPORTUNITY SCORECARD & COMPARATIVE MATRIX");
  lines.push(`| Opportunity | Category | Evidence Score | Confidence | Min Capital (${metadata.currency}) | Monthly Profit (${metadata.currency}) | Indep. Sources |`);
  lines.push("| :--- | :--- | :---: | :---: | :---: | :---: | :---: |");

  for (const item of items) {
    const funding = item.financials?.funding != null ? item.financials.funding.toLocaleString("en-IN") : "—";
    const profit = item.financials?.scenarios[1]?.profit != null ? item.financials.scenarios[1].profit.toLocaleString("en-IN") : "—";
    const score = item.strength != null ? `${item.strength}/100` : "Needs check";
    let sources = 0;
    try {
      sources = independentSourceCount(item.sources || []);
    } catch {
      sources = item.sources ? item.sources.length : 0;
    }
    lines.push(`| **${item.name}** | ${item.category} | ${score} | ${item.confidence} | ${funding} | ${profit} | ${sources} |`);
  }
  lines.push("");

  lines.push("### 3. OPPORTUNITY DEEP-DIVES & RISK MITIGATION");
  for (let i = 0; i < items.length; i++) {
    const opp = items[i];
    lines.push(`#### 3.${i + 1} ${opp.name}`);
    lines.push(`- **Sector & Category:** ${opp.category}`);
    lines.push(`- **Strategic Thesis:** ${opp.problem ?? "Unsolved workflow with rising demand signal."}`);
    if (opp.gap) {
      lines.push(`- **Market Gap / Unmet Need:** *${opp.gap}*`);
    }

    if (opp.financials) {
      lines.push("");
      lines.push("##### Unit Economics & Capital Plan");
      lines.push("*Scenario estimates from model inputs; not actual results or forecasts.*");
      lines.push(`- **Required Startup Investment:** ${metadata.currency} ${opp.financials.funding.toLocaleString("en-IN")}`);
      lines.push(`- **Base Monthly Operating Profit:** ${metadata.currency} ${opp.financials.scenarios[1].profit.toLocaleString("en-IN")}`);
      lines.push(`- **Conservative Case (-50% vol):** ${metadata.currency} ${opp.financials.scenarios[0].profit.toLocaleString("en-IN")}`);
      lines.push(`- **Expansion Case (+50% vol):** ${metadata.currency} ${opp.financials.scenarios[2].profit.toLocaleString("en-IN")}`);
    }

    if (opp.risks && opp.risks.length > 0) {
      lines.push("");
      lines.push("##### Known Risks & Downside Mitigation");
      for (const r of opp.risks) {
        if (typeof r === "string") {
          lines.push(`- ⚠️ **Risk:** ${r}`);
        } else if (typeof r === "object" && r !== null) {
          lines.push(`- ⚠️ **Risk:** ${(r as { risk: string; mitigation: string }).risk} → **Mitigation:** ${(r as { risk: string; mitigation: string }).mitigation}`);
        }
      }
    }

    if (opp.sources && opp.sources.length > 0) {
      lines.push("");
      lines.push("##### Linked Source Records (not independently verified)");
      for (const s of opp.sources) {
        lines.push(`- [${s.title || s.url}](${s.url}) · Published: ${s.publishedAt || "Unknown"} · Retrieved: ${s.retrievedAt || "Unknown"}`);
      }
    }
    if (opp.claims?.length) {
      lines.push("");
      lines.push("##### Extracted Claims (check source before relying on them)");
      for (const claim of opp.claims) {
        lines.push(`- **${claim.direction}:** ${claim.text} · Linked sources: ${claim.sourceIds.length}`);
      }
    }
    if (opp.missing?.length) {
      lines.push("");
      lines.push("##### Evidence Gaps");
      for (const gap of opp.missing) lines.push(`- ${gap}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("### 4. Suggested Validation Actions (not completed work)");
  lines.push("1. Interview target buyers about a recent purchase or decision; record role, date, geography, and current workaround.");
  lines.push("2. Test a specific price with a real paid pilot or preorder before relying on stated interest.");
  lines.push("3. Set a continue/revise/stop threshold before the test; compare observed commitments and costs against it.");
  lines.push("");
  lines.push("*Generated by Businessman. Research and validation actions require human review and execution.*");

  return lines.join("\n");
}

export function downloadDossierReport(
  items: ResearchOpportunity[],
  metadata: DossierReportMetadata
): void {
  const markdown = generateExecutiveDossierMarkdown(items, metadata);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = metadata.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  link.href = url;
  link.download = `executive-dossier-${slug || "market"}-${metadata.generatedDate}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
