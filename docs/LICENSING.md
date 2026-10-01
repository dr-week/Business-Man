# Licensing, Intellectual Property & Commercial Protection Strategy

## How to Prevent Tech Theft While Keeping the Core Open Source

> [!IMPORTANT]
> **Can anyone steal our tech if it is open source?**
> If released under a permissive license like standard MIT, competitors can fork the code, rebrand it, run it as a cloud service, and never contribute anything back.
> To protect your investment and ensure the project **makes money specifically for you**, modern developer businesses (like Supabase, PostHog, Plausible, MongoDB, and Elastic) adopt a **Dual-License / Open-Core** architecture.

---

## 1. The Recommended Commercial Protection Architecture

### Tier 1: Strong Copyleft Protection (AGPLv3)
- **License for Self-Hosters:** GNU Affero General Public License v3 (AGPL-3.0).
- **Why this stops tech theft:** Under AGPLv3, if any competing company takes your code and hosts it as a cloud service (SaaS), they **must publicly release 100% of their source code, modifications, and infrastructure changes** under the same license.
- **Result:** Large cloud providers and competitors cannot take your platform proprietary.

### Tier 2: Open-Core (Proprietary Commercial Modules)
Keep the engine modular (as structured in `BUSINESSman`):
- **Free Open-Source Core:** Basic collector adapters, local SQLite cache, scenario mathematics, basic decision engine.
- **Commercial / Enterprise Modules (Proprietary / Cloud-Only):**
  1. Multi-source paid scraping pool (Brave Search API, Google Places, Indian Registrar/Census data connectors).
  2. Proprietary LAYA System-1 instant triage models & live negative-signal weights.
  3. Executive Dossier PDF export with branded investor reports.
  4. Collaborative Diligence escrow payments & 15% platform verification fee.
  5. Multi-user syndicate/incubator cohort analytics workspaces.

### Tier 3: Business Source License (BSL 1.1) Alternative
- **What it is:** Free for non-production / non-competitive use, converts to MIT after 3–4 years.
- **Used by:** Sentry, HashiCorp, MariaDB.
- **Rule:** Anyone can inspect, self-host, and contribute, but **no one can sell it as a competing commercial service**.

---

## 2. Contributor License Agreement (CLA)

To retain the exclusive legal right to offer commercial cloud hosting and sell proprietary add-ons, outside contributors must submit pull requests under a **Contributor License Agreement (CLA)** or **Developer Certificate of Origin (DCO)**.
- This ensures you (as creator) retain copyright and can dual-license the software.
- The project includes [`CLA.txt`](file:///c:/Users/disha/Documents/CODES/studio/BUSINESSman/CLA.txt) to govern community contributions.

---

## 3. Dependency Audit

The lockfile contains packages under MIT, Apache-2.0, BSD, ISC, and MPL-2.0. None of these conflict with an AGPL or Open-Core commercial hosting model.

References: [GNU AGPL FAQ](https://www.gnu.org/licenses/gpl-faq.en.html), [Business Source License FAQ](https://mariadb.com/bsl-faq-adopting/), [OSI License Guide](https://opensource.org/licenses).

