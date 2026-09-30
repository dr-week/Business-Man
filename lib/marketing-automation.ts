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
  productHuntPitch: {
    tagline: string;
    makerComment: string;
  };
  weeklyDistributionCadence: {
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
    : "Low upfront capital";
  const monthlyProfit = opportunity.financials?.scenarios[1]?.profit != null
    ? `${currency} ${opportunity.financials.scenarios[1].profit.toLocaleString("en-IN")}/mo`
    : "High recurring margin";
  const testMove = opportunity.nextTest || "Interview 10 target buyers before building";

  const targetAudience = opportunity.buyer || "Founders, operators, and niche businesses";
  const distributionChannels = [
    "X / Twitter Tech & Indie Hacker Community",
    "LinkedIn B2B Decision Makers & Incubators",
    "Direct Cold DM / Email to Qualified Operators",
    "Product Hunt / Launch PHOENIX Showcase",
  ];

  const viralHook = `Why 90% of people will start another generic agency or AI wrapper in 2026—and fail—while the real money is hiding in ${name}.`;

  const xThread = [
    {
      tweetNumber: 1,
      text: `Everyone is getting the exact same advice: "Start an agency" or "Build an AI wrapper."\n\nRunning an agency is like running a hotel—constant churn, zero leverage.\n\nHere is a vetted, low-competition market gap hiding in plain sight: ${name} 🧵👇`,
    },
    {
      tweetNumber: 2,
      text: `1/ The Problem:\n\n${problem}.\n\nMost incumbents ignore this because it's too specialized or unglamorous. But that is exactly where the pricing power lives.`,
    },
    {
      tweetNumber: 3,
      text: `2/ The Unit Economics:\n\n• Startup capital needed: ~${funding}\n• Realistic profit potential: ~${monthlyProfit}\n• Payback period: ~3–5 months\n\nNo vanity metrics. Just positive unit contribution margin.`,
    },
    {
      tweetNumber: 4,
      text: `3/ How to disprove this in 7 days:\n\n${testMove}.\n\nNever write a single line of code until 3 buyers confirm they will pay for a solution.`,
    },
    {
      tweetNumber: 5,
      text: `We use Businessman to continuously uncover rising demand signals before suppliers flood the market.\n\nWant the full research dossier on ${name}? Link below.`,
    },
  ];

  const linkedinPost = `Most business advice for designers, editors, and creators is identical: "Start an agency."

Here is why that advice is broken:
Agencies compete on price against global commodities. You become an overworked freelancer with staff.

Instead, look at specialized protocol shifts and workflow gaps like "${name}".

Sector: ${category}
Target Buyer: ${targetAudience}
Validation Test: ${testMove}

Key takeaway: Don't guess what people want. Track where platform changes and mandatory regulations are forcing buyers to find new software.

Full market dossier generated via Businessman Intelligence Desk. What are your thoughts on this space?`;

  const coldOutreachEmail = {
    subject: `Quick question regarding ${name.toLowerCase()}`,
    body: `Hi {{firstName}},\n\nI noticed you are leading operations in ${category}. Quick question:\n\nAre you currently facing bottlenecks with ${problem}?\n\nWe recently mapped the economics and supply gaps for ${name} (showing potential to unlock ${monthlyProfit} in operational savings).\n\nNot pitching anything—just sharing our 1-page intelligence brief with 5 operators in this space. Mind if I send the PDF overview your way?\n\nBest,\n[Your Name]`,
    callToAction: "Reply 'Yes' to receive the 1-page briefing dossier.",
  };

  const productHuntPitch = {
    tagline: `Vetted market intel & decision dossier for ${name}`,
    makerComment: `Hey PH! We built Businessman because we were sick of generic "AI business idea generators" that suggest dropshipping and agency clones. ${name} is an evidence-backed market gap backed by live regulatory, protocol, or platform demand signals. Check the economics and negative research before spending months building.`,
  };

  const weeklyDistributionCadence = [
    { day: "Monday", platform: "X / Twitter", action: "Post 5-tweet teardown thread highlighting the supply-demand gap." },
    { day: "Tuesday", platform: "LinkedIn", action: "Publish executive commentary targeting category leaders & incubators." },
    { day: "Wednesday", platform: "Cold Outreach", action: "Send 15 targeted emails/DMs using the 1-page intelligence brief hook." },
    { day: "Thursday", platform: "Community", action: "Share findings on relevant subreddits / Discord server discussions." },
    { day: "Friday", platform: "Review Gate", action: "Count qualitative buyer replies: 3+ warm responses = proceed to validation pilot." },
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
    productHuntPitch,
    weeklyDistributionCadence,
  };
}