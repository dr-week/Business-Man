# Contribution guide

## Change boundaries

- UI: `components/<feature>/`; keep focused state and CSS Modules beside feature components. Shared shell styles live in `app/hunt/hunt.scss`.
- Research rules/data: small pure modules in `lib/`; provider adapters in `lib/collectors/`.
- API and persistence: `app/api/`, `db/schema.ts`, and append-only `drizzle/` migrations.
- Evidence follow-up: `lib/validation-plan.ts`; display in `components/research/validation-plan.tsx`.
- Buyer validation records: `lib/validation-progress.ts`; UI in `components/research/validation-checklist.tsx`. Stored completion without a note and credential-free HTTPS link is downgraded; progress is browser-local and user-reported.
- Keep source provenance, unknown values, and estimates explicit. Do not turn signals into sales claims or investment odds.
- Validate external input; keep credentials server-side; preserve owner-scoped database access.
- Reuse installed dependencies. Bound provider time, response size, and result count; avoid unneeded background work.
- Keep UI sections feature-scoped and collapsed/on-demand when secondary. Never present a plan, estimate, or generated prompt as completed employee work or verified outcome.

## Change workflow

1. Find the owning module and read its contract; avoid duplicate/dead modules.
2. Keep changes focused; add a neighboring `*.test.ts` for business rules and failure cases. Prefer deterministic pure modules and small fixtures over provider calls in tests.
3. For schema changes, update `db/schema.ts`, add a numbered migration, then run `npm run db:local:apply` locally.
4. Update the relevant file in `docs/` when behavior or a provider contract changes.
5. Run targeted tests, `npx tsc --noEmit`, and `npm run lint`; run `npm run build` for routing, styling, or bundling changes.

Useful commands:

```powershell
npm test -- lib/evidence-coverage.test.ts
npx tsc --noEmit
npm run lint
npm run build
```

Windows dev launcher: `scripts/launch.bat`. It checks the saved port against `/api/health`, scans ports 5173–5223, and writes logs under ignored `logs/`. It never terminates a process based on a PID file.

Tests check behavior, not business truth. Review provenance, provider limits, persistence ownership, memory bounds, and unknown/error states separately. For localStorage-backed features, cap imported payload size and retained records; do not trust browser completion flags without required evidence fields.
