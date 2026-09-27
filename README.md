<p align="center">
  <img src="public/logo-banner.svg" alt="Businessman Logo Banner" width="100%" />
</p>

<p align="center">
  <strong>Autonomous Commercial Research Engine & Real-World Demand Discovery Platform</strong>
</p>

<p align="center">
  <a href="#system-architecture"><img src="https://img.shields.io/badge/Architecture-Cloudflare%20Edge%20%7C%20Vinext-gold?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Architecture" /></a>
  <a href="#test-coverage--quality"><img src="https://img.shields.io/badge/Tests-275%20Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" /></a>
  <a href="#code-quality"><img src="https://img.shields.io/badge/TypeScript-Strict%205.x-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#zero-simulation-guarantee"><img src="https://img.shields.io/badge/Integrity-Zero%20Simulation-purple?style=for-the-badge" alt="Zero Simulation" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-lightgrey?style=for-the-badge" alt="License" /></a>
</p>

---

## 🏛️ Executive Summary

**Businessman** is an enterprise-grade commercial intelligence suite engineered to guide operators, founders, and enterprises through factual business entry. 

Unlike theoretical simulators or hallucination-prone conversational wrappers, Businessman operates as an **evidence-grounded research instrument**. It crawls public signals, parses verifiable procurement requests, classifies multi-industry opportunities, and structures unit economics solely from defensible data points.

### The Zero-Simulation Guarantee
* 🚫 **No Game Loops or Synthetic Revenue**: Businessman never simulates financial trajectories, hypothetical customer adoption curves, or synthetic revenues.
* ⚖️ **Missing Is Missing**: If capital expenditures, variable unit costs, or volumes lack verified citations, they are displayed strictly as **Unknown / Unrated**.
* 🔍 **Full Provenance Chain**: Every opportunity is anchored to primary URLs, official registry documents, regulatory decrees, or public tenders with strict timestamp retention.

---

## ⚡ Core Capabilities

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           BUSINESSMAN PLATFORM                            │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ DEMAND DISCOVERY │        │ PERSONALIZED WIRE│        │ UNIT ECONOMICS   │
├──────────────────┤        ├──────────────────┤        ├──────────────────┤
│ • Natural Lang   │        │ • For You (Geo)  │        │ • Scenarios (3x) │
│ • Multi-Provider │        │ • Demand Now     │        │ • Break-Even Math│
│ • Classifier v2  │        │ • Everyday Needs │        │ • Setup vs Work  │
│ • Spelling Fixer │        │ • Inferred Tags  │        │ • Payback Months │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

### 1. Market Research & Multi-Provider Ingestion
- Ingests real-world data points across public networks (Hacker News, Stack Exchange, public registries, and authenticated web scrapers).
- Natural language query normalization with typo tolerance (`lib/query-spelling.ts`), sector classification (`lib/query-classifier.ts`), and intent scoping.
- Deduplication and thematic grouping using algorithmic clustering without requiring heavy runtime models.

### 2. Qualified Personalised Intelligence (News Wire)
- Structured into three mutually exclusive, verified operational streams:
  1. **For You**: Geo-targeted and budget-validated entry point matching the operator's declared capital constraints.
  2. **Demand Now**: Real-time buyer signals featuring explicit order quantities, delivery windows, and procurement deadlines.
  3. **Everyday Business**: Recurring high-need service and manufacturing gaps substantiated by industrial bulletins.
- **Budget Integrity**: If a user's maximum budget is not declared, the engine actively suppresses false affordability ratings until configured in Personalisation.

### 3. Transparent Unit Economics Engine
- Automated sensitivity analysis across Low, Base, and High volume scenarios.
- Strict accounting separation:
  $$\text{Total Initial Funding} = \text{Setup} + \text{Equipment} + \text{Opening Inventory} + \text{Working Capital Reserve}$$
  $$\text{Contribution} = \text{Price} - \text{Variable Cost}$$
  $$\text{Break-Even Units} = \left\lceil \frac{\text{Fixed Cost}}{\text{Contribution}} \right\rceil$$

---

## 🏗️ Technical Architecture & Stack

| Layer | Technologies | Standards / Notes |
|---|---|---|
| **Frontend Framework** | Next.js App Router (via `vinext` / Vite runtime) | Client components, modern server hooks, zero telemetry bloat |
| **Design Language** | Custom Cyber-Japanese Minimalism | Monochromatic palettes, gold accenting, Lucide icons, accessible focus states |
| **Backend & Edge** | Cloudflare Workers & D1 Database | Microsecond edge routing, localized execution, SQLite SQL dialect |
| **Data Integrity** | Zod 3.x Schema Validation | Exhaustive runtime parsing for every API payload, scrape signal, and user input |
| **Testing Suite** | Vitest 5.x | 275+ unit, integration, and security test specs |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `22.13.0` or higher
- **Package Manager**: `npm` 10.x or higher
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/dr-week/Business-Man.git

# Navigate to project directory
cd Business-Man

# Install dependencies
npm install
```

### Local Database Setup (D1 SQLite)

```bash
# Initialize local D1 SQLite state
npm run db:local:apply

# Apply latest business schema migration
npx wrangler d1 execute DB --local --config wrangler.local.jsonc --file drizzle/0001_busy_wrecker.sql --persist-to .wrangler/state
```

### Start Development Server

```bash
# Run multi-project safe launcher (Windows)
scripts\launch.bat

# Or start directly with npm
npm run dev -- --hostname 0.0.0.0
```
Open [http://localhost:5173](http://localhost:5173) (or assigned port) in your browser.

---

## 🧪 Quality Assurance & Test Verification

Businessman enforces continuous verification. Every commit must pass strict linting, typechecking, and the full test suite.

```bash
# Run unit and integration tests (275 tests across 15 suites)
npm test

# Static code quality analysis (ESLint)
npm run lint

# TypeScript verification
npx tsc --noEmit

# Production distribution build
npm run build
```

---

## 📁 Repository Structure

```
.
├── app/
│   ├── api/                 # Cloudflare Edge API endpoints (News, Research, Dossiers)
│   ├── hunt/                # Core Business Hunting workspace & styling
│   └── page.tsx             # Application landing & entry portal
├── components/
│   ├── news-feed.tsx        # Personalised 3-section commercial wire panel
│   ├── source-discovery.tsx # Natural query search, filtering & comparative matrix
│   └── research-charts.tsx  # Dynamic financial scenario visualization
├── db/                      # D1 database schema definitions & migrations
├── docs/                    # Complete architectural & design guidelines
│   ├── BACKEND.md           # API routes, caching, and financial calculations
│   ├── DESIGN.md            # Japanese minimalist UI rules & layout specs
│   └── REQUIREMENT.md       # Product specifications and non-negotiable boundaries
├── lib/
│   ├── news/                # RSS ingestion, deduplication & qualification engine
│   ├── collectors/          # Public webpage fetching & sanitization contracts
│   ├── economics.ts         # Deterministic scenario financial formulas
│   └── research-engine.ts   # Evidence grading, claim evaluation & scoring logic
└── scripts/
    ├── launch.bat           # Port-safe automated Windows process launcher
    └── verify-project.mjs   # Instance conflict prevention utility
```

---

## 🔒 Security & Privacy

- **No Remote Credential Leaks**: Never transmits your personal financial thresholds or research history to third-party ad networks.
- **SSRF Defenses**: External URL scrapers enforce private-range IP bans, HTTPS enforcement, byte limits (max 500KB), and timeout caps.
- **Zero Third-Party Telemetry**: We do not inject remote tracker scripts, user session replays, or analytics beacons.

---

## 📄 License & Governance

Licensed under the **Apache 2.0 License**. See [LICENSE](LICENSE) for details.

Maintained with excellence by the **Businessman Core Engineering Team**.
