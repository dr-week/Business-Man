# Feature: Premium CSV Export for Research Bounties

**Description**
Provide a CSV download endpoint for market‑research bounties, gated behind the existing JWT premium license guard. This complements the PDF export and gives users a lightweight data‑exchange format.

**Scope**
- `lib/marketExportCsv.ts` – CSV generator using `csv-stringify`.
- `app/api/export/report-csv/route.ts` – Next.js API route, JWT‑guarded.
- Add unit test (`lib/marketExportCsv.test.ts`) to verify header & row count.
- Update Lean guide with a short note under *Export Features*.

**Acceptance Criteria**
1. Authenticated request with a premium token returns `200` and a `text/csv` payload.
2. Non‑premium or missing token returns `403`.
3. CSV contains columns: `id, title, description, createdAt, status, sector, estimatedRevenue`.
4. No runtime errors; memory usage stays < 50 MB for ≤ 10 k rows.

**Labels**: `feature`, `export`, `premium`, `api`

**Milestones**: `v1.2` (next minor release)
