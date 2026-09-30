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

export function generateMarketingCampaign(opportunity: ResearchOpportunity, currency = "INR"): MarketingCampaign {
  const name = opportunity.name;
  const category = opportunity.category || "Niche Business";
  const problem = opportunity.problem || "Unsolved workflow friction";
  const funding = opportunity.financials?.funding != null
    ? `${currency} ${opportunity.financials.funding.toLocaleString("en-IN")}`
    : "Not estimated";
  const monthlyProfit = opportunity.financials?.scenarios[1]?.profit != null
    ? `${currency} ${opportunity.financials.scenarios[1].profit.toLocaleString("en-IN")}/mo`
    : "Not estimated";
  const testMove = opportunity.gap || "Interview 10 target buyers before building";

  const targetAudience = opportunity.buyer || "Founders, operators, and niche businesses";
  const distributionChannels = [
    "X / Twitter Tech & Indie Hacker Community",
    "LinkedIn B2B Decision Makers & Incubators",
    "Direct Cold DM / Email to Qualified Operators",
    "Product Hunt / Launch PHOENIX Showcase",
  ];

  const viralHook = `A research brief on ${name} (${category}): the buyer, current alternatives, open questions, and assumptions worth testing.`;

  const xThread = [
    {
      tweetNumber: 1,
      text: `Could ${name} be a business opportunity?\n\nThis brief maps the buyer, problem, alternatives, and evidence gaps. It is a hypothesis to investigate, not a promise of demand. 🧵👇`,
    },
    {
      tweetNumber: 2,
      text: `1/ The reported problem:\n\n${problem}.\n\nNext step: verify how often it happens, what it costs, and whether buyers already pay to address it.`,
    },
    {
      tweetNumber: 3,
      text: `2/ Scenario economics (estimates, not actual results):\n\n• Initial funding assumption: ${funding}\n• Base monthly operating profit assumption: ${monthlyProfit}\n\nReview the inputs and validate them with buyers before relying on these figures.`,
    },
    {
      tweetNumber: 4,
      text: `3/ A useful next validation step:\n\n${testMove}.\n\nRecord both supporting and contradicting evidence.`,
    },
    {
      tweetNumber: 5,
      text: `Businessman organizes source-linked research, assumptions, and validation steps for opportunities like ${name}.\n\nThis is early analysis; speak with potential buyers before investing.`,
    },
  ];

  const linkedinPost = `We researched a specific business opportunity: "${name}".

Sector: ${category}
Target Buyer: ${targetAudience}
Validation Test: ${testMove}

The figures are scenario estimates, and the demand hypothesis still needs buyer validation. What evidence would change your view?`;

  const coldOutreachEmail = {
    subject: `Quick question regarding ${problem.slice(0, 30)}...`,
    body: `Hi {{firstName}},\n\nI’m researching ${category} and looking at this question: ${problem}.\n\nWe have a preliminary brief on ${name}, including the assumptions and evidence gaps. It is not a validated market forecast.\n\nWould a short summary be useful, or is this problem not relevant to your work?\n\nBest,\n[Your Name]`,
    callToAction: "Ask whether a short summary would be useful.",
  };

  const productHuntPitch = {
    tagline: "Source-linked business opportunity research and validation",
    makerComment: `Hey PH! Businessman helps organize opportunity research: source-linked claims, alternatives, scenario assumptions, and questions to validate with buyers. It does not certify demand or promise returns. We are building it to make early business decisions easier to inspect and challenge.`,
  };

  const weeklyDistributionCadence = [
    { day: "Day 1", platform: "Research", action: `Write one falsifiable buyer hypothesis for ${targetAudience}; list the evidence that would disprove it.`, successMeasure: "One named buyer role and one disconfirming signal." },
    { day: "Day 2", platform: "Opt-in channel", action: "Share a short research question in a relevant community or ask for warm introductions. Respect community rules; do not scrape or bulk-message members.", successMeasure: "Qualified replies from the named buyer segment." },
    { day: "Day 3", platform: "Buyer interviews", action: "Ask willing buyers about their last real occurrence, current workaround, and cost. Avoid pitching before understanding the problem.", successMeasure: "Dated notes with role, geography, workaround, and recent example." },
    { day: "Day 4", platform: "Paid pilot", action: "Offer a specific scope and price to qualified buyers; record offers separately from actual payments.", successMeasure: "Actual payments separately from offers; record currency and amount." },
    { day: "Day 5", platform: "Review gate", action: "Compare observed evidence with the pre-set continue/revise/stop threshold; update the opportunity record.", successMeasure: "Decision and next test recorded; no response is not a positive signal." },
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
