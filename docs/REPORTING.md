# Reporting

Saved evidence CSVs stream from `GET /api/hunt/research-runs/evidence?id=<uuid>`. The route authenticates the owner, validates the saved brief, then pulls one escaped row at a time from `lib/reporting/evidence-csv.ts`. Keep the client download as a direct link; fetching the full JSON first recreates the memory spike this endpoint avoids.
