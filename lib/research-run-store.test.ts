import { describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { listResearchRuns, parseResearchBackup, saveResearchRun } from "./research-run-store";

describe("research run storage", () => {
  it("imports a supported backup as a new owner-scoped snapshot", () => {
    const row = parseResearchBackup({
      format: "businessman-research-run", formatVersion: 1,
      run: {
        id: "old-run", ownerId: "old-owner", schemaVersion: 1,
        topic: "Cafe demand", geography: "Goa, India", currency: "INR", createdAt: "2026-09-20T10:00:00.000Z",
        input: { topic: "Cafe demand", geography: "Goa, India", currency: "INR", budget: null },
        result: { opportunities: [] },
      },
    }, "new-owner");

    expect(row.id).not.toBe("old-run");
    expect(row.ownerId).toBe("new-owner");
    expect(row.topic).toBe("Cafe demand");
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

  it("loads only the latest snapshot for its owner", () => {
    const db = drizzle({} as D1Database, { schema });
    const query = listResearchRuns(db, "owner-1").toSQL();
    expect(query.sql).toContain('from "research_runs"');
    expect(query.sql).toContain('"schema_version"');
    expect(query.sql).toContain('"research_runs"."owner_id" = ?');
    expect(query.sql).toContain('order by "research_runs"."created_at" desc, "research_runs"."id" desc');
    expect(query.sql).toContain("limit ?");
    expect(query.params).toEqual(["owner-1", 20]);
  });

  it("retains the inserted run and the 19 newest prior runs", async () => {
    const db = drizzle({} as D1Database, { schema });
    const batch = vi.spyOn(db, "batch").mockResolvedValue([] as never);
    await saveResearchRun(db, {
      id: "run-1", ownerId: "owner-1", schemaVersion: 1, topic: "cafes", geography: "Goa, India", currency: "INR", input: {}, result: {},
    });

    expect(batch).toHaveBeenCalledOnce();
    const [insert, prune] = batch.mock.calls[0][0] as unknown as readonly { toSQL(): { sql: string; params: unknown[] } }[];
    const inserted = insert.toSQL();
    expect(inserted.sql).toContain('insert into "research_runs"');
    expect(inserted.sql).toContain('"schema_version"');
    expect(inserted.params).toContain(1);
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
