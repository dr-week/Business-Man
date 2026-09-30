# LEAN_GUIDE.md

## Purpose
A concise, contributor‑focused guide describing the **modular** architecture of **BUSINESSman**, the licensing model, and how to add new features without bloating the codebase.

## Core Principles
- **Modularity** – each capability lives in its own folder (`lib/`, `components/`, `app/api/`).
- **Lean Documentation** – only document what a newcomer needs to get started; avoid exhaustive API lists.
- **Licensing status** – no root license is present; do not describe this repository as AGPL/open source or promise premium feature gates until ownership, dependency licenses, and a license are reviewed. A token gate controls hosted entitlements; it does not prevent copying code users are licensed to receive.
- **Randomised Development Cycle** – each run picks a random combo of Work Type, Module, Target, Source, Validation to keep work fresh.

## Monetization boundary

- Sell hosted operation, refreshed research, team workflows, integrations, support, and human field validation. These can create ongoing value while the code remains available under its chosen license.
- Decide license before public distribution. AGPL-3.0 requires offering corresponding source to users interacting remotely with a modified version. A commercial license requires rights from all relevant copyright holders; do not assume contributor code can be relicensed.
- A signed-token check is only a hosted-product entitlement control. It cannot stop a customer from removing a check in a code copy they are allowed to modify. Never ship signing secrets in the client or repository.
- Do not gate placeholder or core functionality as paid. Implement the paid workflow, entitlement issuer, expiry/revocation, and owner-scoped access before selling it.
- Before adding `LICENSE`, confirm authorship/assignment and review third-party notices. Until then, describe the license as undecided.

## Issue Template (copy‑paste into a new issue)
```
### Summary
Add premium PDF export for bounties (licensed).

### Type
feature

### Module
export/report

### Work Type
feature

### Improvement Target
premium feature gating

### Validation Method
test

### Acceptance Criteria
- `GET /api/export/report?bountyId=...` returns a base64‑encoded PDF when a valid `Authorization: Bearer <token>` header is present.
- Returns `401` for missing token, `403` for invalid token.
- Test coverage ≥ 80%.
```
