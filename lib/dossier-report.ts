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
    `A total of **${items.length} qualified opportunities** were identified, filtered through negative-research falsification, ` +
    `unit economics modeling, and multi-source independent validation.`
  );
  lines.push("");
  lines.push("**Key Decision Takeaway:**");
  lines.push(
    "- Markets with verifiable regulatory pressure or protocol transitions (e.g. Agentic Commerce, KaiOS, ONDC, Compliance) present higher margins and lower acquisition costs than commodity services.\n" +
    "- Immediate priority: Test willingness-to-pay with pre-sales or structured validation pilots before capital expenditure."
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
      lines.push("##### Verified Sources & Evidence");
      for (const s of opp.sources) {
        lines.push(`- [${s.title || s.url}](${s.url}) (${s.publishedAt || "Recent"})`);
      }
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("### 4. RECOMMENDED NEXT MOVES (DAYS 1–21)");
  lines.push("1. **Days 1–7 (Interview 10 Buyers):** Validate problem urgency with zero code; confirm buying authority and budget.");
  lines.push("2. **Days 8–14 (Pre-order / Paid Pilot Test):** Secure a letter of intent (LOI) or ₹1,000–₹5,000 pilot deposit.");
  lines.push("3. **Days 15–21 (Kill or Build Gate):** If fewer than 2 buyers commit, terminate thesis immediately and switch to alternative finding.");
  lines.push("");
  lines.push("*Generated by Businessman Autonomous Market Intelligence Desk.*");

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
