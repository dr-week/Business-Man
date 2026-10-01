import { describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import * as schema from "@/db/schema";
import { findDuplicateResearchRun, listResearchRuns, parseResearchBackup, saveResearchRun } from "./research-run-store";

describe("research run storage", () => {
  it("indexes owner history in the same order used by list queries", () => {
    const historyIndex = getTableConfig(schema.researchRuns).indexes.find(({ config }) => config.name === "research_runs_owner_created_idx");
    expect(historyIndex?.config.columns.map((column) => "name" in column ? column.name : "")).toEqual(["owner_id", "created_at", "id"]);
  });

  it("imports a supported backup as a new owner-scoped snapshot", () => {
    const row = parseResearchBackup({
      format: "businessman-research-run", formatVersion: 1, exportedAt: "2026-09-30T10:00:00.000Z",
      run: {
        id: "old-run", ownerId: "old-owner", schemaVersion: 1,
        topic: "Cafe demand", geography: "Goa, India", currency: "INR", createdAt: "2026-09-20T10:00:00.000Z",
        input: { topic: "Cafe demand", geography: "Goa, India", currency: "INR", budget: null },
        result: { opportunities: [], webResearch: [{ title: "Market reference", url: "https://example.com/market", snippet: "Candidate link" }], webSearchConfigured: true },
      },
    }, "new-owner");

    expect(row.id).not.toBe("old-run");
    expect(row.ownerId).toBe("new-owner");
    expect(row.topic).toBe("Cafe demand");
    expect(row.result).toMatchObject({ webResearch: [{ title: "Market reference" }], webSearchConfigured: true });
  });

  it("rejects backups whose metadata conflicts with the validated input", () => {
    expect(() => parseResearchBackup({
      format: "businessman-research-run", formatVersion: 1,
      run: {
        schemaVersion: 1, topic: "Cafe demand", geography: "Goa, India", currency: "INR", createdAt: "2026-09-20T10:00:00.000Z",
        input: { topic: "Bakery demand", geography: "Goa, India", currency: "INR", budget: null },
        result: { opportunities: [] },
      },
    }, "owner-1")).toThrow("Backup metadata does not match");
  });

  it("rejects imported evidence whose claim or factor points outside the snapshot", () => {
    const opportunity = {
      id: "hotel-service", name: "Hotel service", category: "Hospitality", geography: "Goa, India", buyer: null,
      problem: "A recurring service issue", offering: null, alternatives: [], gap: null, risks: [],
      sources: [{ id: "source-1", provider: "Open dataset", title: "Hospitality dataset", url: "https://example.com/data", publishedAt: "2026-01-01", retrievedAt: "2026-09-30" }],
      claims: [{ id: "claim-1", text: "Registration totals are published by district.", direction: "context", sourceIds: ["source-1"] }], assumptions: {},
      factors: [{ name: "Paid demand", weight: 25, score: null, evidenceIds: ["claim-1"], rule: "Needs buyer evidence." }], strength: null, confidence: "Low", financials: null, missing: [],
    };
    const backup = {
      format: "businessman-research-run", formatVersion: 1,
      run: {
        schemaVersion: 1, topic: "Hotel service", geography: "Goa, India", currency: "INR", createdAt: "2026-09-20T10:00:00.000Z",
        input: { topic: "Hotel service", geography: "Goa, India", currency: "INR", budget: null }, result: {
          opportunities: [opportunity], webResearch: [{ title: "Public source", url: "https://example.com/report", snippet: "A source link." }],
        },
      },
    };
    expect(() => parseResearchBackup(backup, "owner-1")).not.toThrow();

    opportunity.claims[0].sourceIds = ["missing-source"];
    expect(() => parseResearchBackup(backup, "owner-1")).toThrow("Backup format is invalid");
    opportunity.claims[0].sourceIds = ["source-1"];
    opportunity.factors[0].evidenceIds = ["missing-claim"];
    expect(() => parseResearchBackup(backup, "owner-1")).toThrow("Backup format is invalid");
    opportunity.factors[0].evidenceIds = ["claim-1"];
    opportunity.sources[0].url = "javascript:alert(1)";
    expect(() => parseResearchBackup(backup, "owner-1")).toThrow("Backup format is invalid");
    opportunity.sources[0].url = "https://example.com/data";
    backup.run.result.webResearch[0].url = "data:text/html,unsafe";
    expect(() => parseResearchBackup(backup, "owner-1")).toThrow("Backup format is invalid");
  });

  it("loads only the latest snapshot for its owner", () => {
    const db = drizzle({} as D1Database, { schema });
    const query = listResearchRuns(db, "owner-1").toSQL();
    expect(query.sql).toContain('from "research_runs"');
    expect(query.sql).toContain('"schema_version"');
    expect(query.sql).toContain('"top_opportunity"');
    expect(query.sql).not.toContain("json_extract");
    expect(query.sql).toContain('"research_runs"."owner_id" = ?');
    expect(query.sql).toContain('order by "research_runs"."created_at" desc, "research_runs"."id" desc');
    expect(query.sql).toContain("limit ?");
    expect(query.params).toEqual(["owner-1", 20]);
  });

  it("matches identical imported results despite JSON object key order", async () => {
    const input = { topic: "Cafe demand", geography: "Goa, India", currency: "INR" };
    const result = { opportunities: [], webResearch: [] };
    const db = { select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: "existing-run", result: { webResearch: [], opportunities: [] } }] }) }) }) } as never;
    await expect(findDuplicateResearchRun(db, {
      ownerId: "owner-1", schemaVersion: 1, topic: input.topic, geography: input.geography, currency: input.currency,
      createdAt: "2026-09-30T10:00:00.000Z", input, result,
    })).resolves.toEqual([{ id: "existing-run" }]);
  });

  it("retains the inserted run and the 19 newest prior runs", async () => {
    const db = drizzle({} as D1Database, { schema });
    const batch = vi.spyOn(db, "batch").mockResolvedValue([] as never);
    await saveResearchRun(db, {
      id: "run-1", ownerId: "owner-1", schemaVersion: 1, topic: "cafes", geography: "Goa, India", currency: "INR", input: {},
      result: { opportunities: [{ name: "Cafe subscriptions", confidence: "Medium", strength: 63 }, { name: "ignored", confidence: "Low", strength: 10 }] },
    });

    expect(batch).toHaveBeenCalledOnce();
    const [insert, prune] = batch.mock.calls[0][0] as unknown as readonly { toSQL(): { sql: string; params: unknown[] } }[];
    const inserted = insert.toSQL();
    expect(inserted.sql).toContain('insert into "research_runs"');
    expect(inserted.sql).toContain('"schema_version"');
    expect(inserted.params).toContain(1);
    expect(inserted.params).toEqual(expect.arrayContaining(["Cafe subscriptions", "Medium", 63]));
    expect(inserted.params).toEqual(expect.arrayContaining([expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)]));
    const query = prune.toSQL();
    expect(query.sql).toContain('delete from "research_runs"');
    expect(query.sql).toContain("not in");
    expect(query.sql).toContain("limit ?");
    expect(query.params).toContain("owner-1");
    expect(query.params).toContain(19);
    expect(query.params).toContain("run-1");
    expect(query.sql.match(/"research_runs"\."id" <> \?/g)).toHaveLength(2);
  });

  it("rejects snapshots above the D1 row budget before writing", async () => {
    const db = drizzle({} as D1Database, { schema });
    const batch = vi.spyOn(db, "batch");
    await expect(saveResearchRun(db, {
      id: "run-large", ownerId: "owner-1", topic: "cafes", geography: "Goa, India", currency: "INR", input: {}, result: { text: "x".repeat(1_900_000) },
    })).rejects.toThrow("Research snapshot exceeds the D1 row budget");
    expect(batch).not.toHaveBeenCalled();
  });

  it("rejects unsupported snapshot versions before writing", async () => {
    const db = drizzle({} as D1Database, { schema });
    const batch = vi.spyOn(db, "batch");
    await expect(saveResearchRun(db, {
      id: "run-future", ownerId: "owner-1", schemaVersion: 2, topic: "cafes", geography: "Goa, India", currency: "INR", input: {}, result: {},
    })).rejects.toThrow("Unsupported research snapshot schema version");
    expect(batch).not.toHaveBeenCalled();
  });
});
