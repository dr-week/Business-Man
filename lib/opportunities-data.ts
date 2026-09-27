export type Opportunity = {
  id: string;
  name: string;
  market: string;
  stage: "Signal" | "Watch" | "Validate";
  thesis: string;
  nextTest: string;
  evidence: { claim: string; source: string; url: string; risk?: boolean }[];
  category?: "Platforms" | "AI Infrastructure" | "Industry Software" | "Devices" | "Regulation" | "Market Transfer";
  buyer?: string;
  product?: string;
  model?: string;
  skills?: string;
  risks?: { risk: string; mitigation: string }[];
};

export const opportunities: Opportunity[] = [
  {
    id: "kaios",
    name: "KaiOS utility apps",
    market: "Feature phones",
    stage: "Validate",
    category: "Platforms",
    buyer: "Users · operators · OEMs",
    product: "Offline-first utility for payments, navigation or local information.",
    model: "KaiAds · OEM license",
    skills: "TypeScript · HTML · KaiOS APIs",
    thesis: "A live feature-phone ecosystem with a small app catalog and global distribution.",
    nextTest: "Interview 10 users and submit one utility prototype.",
    evidence: [
      { claim: "KaiOS lists 74 devices and 1,500+ apps.", source: "KaiOS · 2026", url: "https://www.kaiostech.com/explore/" },
      { claim: "Reliance still reports a KaiOS investment.", source: "RIL · 2024–25", url: "https://www.ril.com/ar2024-25/pdf/RIL-Integrated-Annual-Report-2024-25.pdf" },
      { claim: "Store submissions and device testing remain available.", source: "KaiOS Developer", url: "https://developer.kaiostech.com/docs/distribution/submission-portal/" },
      { claim: "Recent device momentum and revenue per user are unclear.", source: "Open question", url: "#", risk: true },
    ],
    risks: [
      { risk: "Slow device growth", mitigation: "Validate active regions before building." },
      { risk: "Low ad revenue", mitigation: "Test OEM or operator licensing." },
      { risk: "Platform control", mitigation: "Keep core logic portable." },
    ],
  },
  {
    id: "agent-trust",
    name: "Agent trust registry",
    market: "Agent infrastructure",
    stage: "Validate",
    category: "AI Infrastructure",
    buyer: "Enterprise AI teams",
    product: "Registry and allowlist for discoverable, verified agent capabilities.",
    model: "SaaS · per-seat license",
    thesis: "Teams need to find and approve safe agent capabilities.",
    nextTest: "Interview 10 internal-agent teams.",
    evidence: [
      { claim: "ARD standardizes capability discovery and verification.", source: "Google · Jun 2026", url: "https://developers.googleblog.com/announcing-the-agentic-resource-discovery-specification/" },
      { claim: "Budget ownership is unknown.", source: "Open question", url: "#", risk: true },
    ],
    risks: [
      { risk: "No clear buyer budget", mitigation: "Ask for a paid pilot before building." },
      { risk: "Platform may solve this internally", mitigation: "Target one missing workflow." },
    ],
  },
  {
    id: "agent-commerce",
    name: "Agent commerce onboarding",
    market: "Commerce protocols",
    stage: "Validate",
    category: "Platforms",
    buyer: "Indian merchants · D2C brands",
    product: "Agent-readable catalog adapter and checkout flow for Indian sellers.",
    model: "Transaction fee · setup fee",
    thesis: "Merchants need agent-readable catalogs and checkout flows.",
    nextTest: "Audit 20 Indian merchant catalogs.",
    evidence: [
      { claim: "UCP defines a shared commerce lifecycle.", source: "Google · Jan 2026", url: "https://developers.googleblog.com/developers-guide-to-ai-agent-protocols/" },
      { claim: "Merchant urgency is unverified.", source: "Open question", url: "#", risk: true },
    ],
    risks: [
      { risk: "Low merchant urgency", mitigation: "Find 3 merchants with an active agent use case first." },
      { risk: "High acquisition cost", mitigation: "Use existing marketplace communities." },
    ],
  },
  {
    id: "agent-audit",
    name: "Agent audit trails",
    market: "Regulated AI",
    stage: "Watch",
    category: "AI Infrastructure",
    buyer: "Compliance teams · regulated enterprises",
    product: "Approval, replay and evidence system for long-running agents.",
    model: "Enterprise SaaS",
    thesis: "Long-running agents need approvals, replay and evidence.",
    nextTest: "Map one regulated workflow.",
    evidence: [
      { claim: "Agents now run across tools, files and sandboxes.", source: "OpenAI · Sep 2026", url: "https://openai.com/index/introducing-the-agents-api/" },
      { claim: "Existing observability tools may be sufficient.", source: "Open question", url: "#", risk: true },
    ],
    risks: [
      { risk: "Incumbent observability tools", mitigation: "Target one unserved regulated workflow." },
      { risk: "Regulation may mandate specific formats", mitigation: "Obtain specialist review before building." },
    ],
  },
  {
    id: "aikosh-data",
    name: "AIKosh data readiness",
    market: "India AI",
    stage: "Signal",
    category: "AI Infrastructure",
    buyer: "AI labs · government bodies",
    product: "Dataset cleaning, provenance tagging and evaluation tooling.",
    thesis: "Public datasets need cleaning, provenance and evaluation.",
    nextTest: "Inspect 20 datasets for repeat gaps.",
    evidence: [
      { claim: "AIKosh hosts datasets, models and toolkits.", source: "IndiaAI · 2026", url: "https://aikosh.indiaai.gov.in/home/about-us/" },
      { claim: "Commercial reuse terms need review.", source: "Open question", url: "#", risk: true },
    ],
    risks: [
      { risk: "Unclear commercial reuse", mitigation: "Review licensing before any build." },
      { risk: "Government buyer cycle is long", mitigation: "Target private AI labs first." },
    ],
  },
  {
    id: "india-adapters",
    name: "India protocol adapters",
    market: "Cross-border tools",
    stage: "Signal",
    category: "Market Transfer",
    buyer: "Indian exporters · global agent platforms",
    product: "GST, catalog, payment and logistics bridge for agent ecosystems.",
    thesis: "Indian workflows need bridges to global agent protocols.",
    nextTest: "Test one export workflow manually.",
    evidence: [
      { claim: "Agent protocols now cover tools, agents and commerce.", source: "Google · Mar 2026", url: "https://developers.googleblog.com/developers-guide-to-ai-agent-protocols/" },
      { claim: "Payment and logistics access may block entry.", source: "Open question", url: "#", risk: true },
    ],
    risks: [
      { risk: "Payment infrastructure barriers", mitigation: "Partner with an existing payment gateway." },
      { risk: "Low initial demand", mitigation: "Interview 10 exporters before any build." },
    ],
  },
];
