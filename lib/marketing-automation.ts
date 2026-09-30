import type { ResearchOpportunity } from "@/lib/research-engine";

export interface MarketingCampaign {
  opportunityId: string;
  opportunityName: string;
  targetAudience: string;
  distributionChannels: string[];
  viralHook: string;
  xThread: {
    tweetNumber: number;
    text: string;
  }[];
  linkedinPost: string;
  coldOutreachEmail: {
    subject: string;
    body: string;
    callToAction: string;
  };
  coldEmail: {
    subject: string;
    body: string;
    callToAction: string;
  };
  productHuntPitch: {
    tagline: string;
    makerComment: string;
  };
  weeklyDistributionCadence: {
    day: string;
    action: string;
    platform: string;
    successMeasure: string;
  }[];
  fiveDayCadence: {
    day: string;
    action: string;
    platform: string;
  }[];
}

export function generateMarketingCampaign(opportunity: ResearchOpportunity, _currency = "INR"): MarketingCampaign {
  const name = opportunity.name;
  const targetAudience = "Founders evaluating an idea, small businesses considering expansion, and advisors or incubators supporting those decisions";
  const distributionChannels = [
    "LinkedIn founder, small-business, and advisor networks",
    "Founder communities and incubator programs that allow research requests",
    "Warm introductions to founders and business advisors",
    "Product Hunt after the product and onboarding are ready",
  ];
  const viralHook = `Before committing money to a business idea, check the buyer, alternatives, costs, and evidence gaps. Businessman puts those questions in one source-linked decision brief. Current example: ${name} — a research lead, not proof of demand.`;
  const xThread = [
    { tweetNumber: 1, text: "Before you invest in a business idea, test the case.\n\nBusinessman organizes market signals, buyer questions, alternatives, and financial assumptions into one research brief. 🧵" },
    { tweetNumber: 2, text: `1/ Start with a specific opportunity: ${name}.\n\nName the buyer and recurring problem. Check the source and date behind each claim; keep unsupported details marked unknown.` },
    { tweetNumber: 3, text: "2/ Compare current alternatives and show low, base, and high economics.\n\nPrices, costs, and sales volumes stay labeled as sourced, estimated, user-entered, or missing. Scenarios are not forecasts." },
    { tweetNumber: 4, text: "3/ Turn the biggest unknown into a buyer test.\n\nAsk what the person did the last time this happened, what workaround they used, and whether they paid for it. Record evidence that could disprove the idea, too." },
    { tweetNumber: 5, text: `Businessman is for founders and advisors deciding what to investigate before investing.\n\n${name} is only an example research lead. The tool does not certify demand or promise returns.` },
  ];
  const linkedinPost = `I'm building Businessman for founders and advisors who need to decide what to investigate before committing capital.\n\nIt brings source-linked market signals, buyers, alternatives, contradictions, and low/base/high financial assumptions into one decision brief. Missing evidence stays visible.\n\nOne current example is ${name}; it is a lead to validate, not a proven opportunity.\n\nHow do you test an idea today, and what do you pay for that research?`;
  const coldOutreachEmail = {
    subject: "How do you test a business idea before investing?",
    body: "Hi {{firstName}},\n\nI'm building Businessman, a research tool that organizes source-linked market signals, alternatives, buyer questions, and financial assumptions into a decision brief.\n\nI'm speaking with founders and advisors who evaluate ideas before committing capital. How do you do this today, and do you pay for research or data?\n\nWould you be open to a 15-minute conversation? This is a request for feedback, not a claim that our research has validated demand.\n\nBest,\n[Your Name]",
    callToAction: "Request a short product-discovery interview; do not send unsolicited bulk messages.",
  };
  const productHuntPitch = {
    tagline: "Source-linked market research briefs for business decisions",
    makerComment: "Businessman helps founders and advisors examine an idea before investing: source-linked claims, alternatives, scenario assumptions, and buyer tests in one brief. It keeps estimates and missing evidence visible; it does not certify demand or promise returns.",
  };
  const weeklyDistributionCadence = [
    { day: "Day 1", platform: "Research", action: `Choose one initial segment from: ${targetAudience}. Write a falsifiable hypothesis about how they currently research business decisions.`, successMeasure: "One named segment, current workflow, and disconfirming signal." },
    { day: "Day 2", platform: "Opt-in channel", action: "Ask a research question in a community that permits it, or request warm introductions. Follow community rules; do not scrape or bulk-message members.", successMeasure: "Qualified replies from the chosen segment." },
    { day: "Day 3", platform: "Buyer interviews", action: "Ask willing founders or advisors how they evaluated their last idea, which data or services they paid for, and what was missing. Avoid pitching before understanding the workflow.", successMeasure: "Dated notes on role, decision, current workaround, and actual spend." },
    { day: "Day 4", platform: "Paid pilot", action: "Offer a clearly scoped early-access or research-brief pilot at a stated price. Record the offer separately from a completed payment.", successMeasure: "Actual payment recorded with amount and currency; offers alone do not count as revenue." },
    { day: "Day 5", platform: "Review gate", action: "Compare interviews, pilot offers, and payments against a pre-set continue/revise/stop threshold; update the product hypothesis.", successMeasure: "Decision and next test recorded; silence is not positive demand." },
  ];

  return {
    opportunityId: opportunity.id,
    opportunityName: name,
    targetAudience,
    distributionChannels,
    viralHook,
    xThread,
    linkedinPost,
    coldOutreachEmail,
    coldEmail: coldOutreachEmail,
    productHuntPitch,
    weeklyDistributionCadence,
    fiveDayCadence: weeklyDistributionCadence,
  };
}

function escapeCalendarText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/([;,])/g, "\\$1");
}

function foldCalendarLine(value: string): string {
  const encoder = new TextEncoder();
  return value.split(/\r\n|\r|\n/).map((sourceLine) => {
    const lines: string[] = [];
    let line = "";
    let bytes = 0;
    for (const character of sourceLine) {
      const size = encoder.encode(character).byteLength;
      if (bytes + size > 75) {
        lines.push(line);
        line = ` ${character}`;
        bytes = size + 1;
      } else {
        line += character;
        bytes += size;
      }
    }
    lines.push(line);
    return lines.join("\r\n");
  }).join("\r\n");
}

export function buildValidationCalendar(campaign: MarketingCampaign, startDate = new Date()): string {
  const events = campaign.weeklyDistributionCadence.map((item, index) => {
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const formatDate = (date: Date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const safeId = campaign.opportunityId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "research";
    return [
      "BEGIN:VEVENT",
      `UID:${safeId}-validation-${formatDate(start)}-${index}@businessman.local`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `DTSTART;VALUE=DATE:${formatDate(start)}`,
      `DTEND;VALUE=DATE:${formatDate(end)}`,
      `SUMMARY:${escapeCalendarText(`${item.day}: Buyer validation — ${campaign.opportunityName}`)}`,
      `DESCRIPTION:${escapeCalendarText(`${item.action}\nSuccess measure: ${item.successMeasure}\nReview evidence before deciding; generated as a suggested task.`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Businessman//Buyer Validation Plan//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
    "",
  ].map(foldCalendarLine).join("\r\n");
}
