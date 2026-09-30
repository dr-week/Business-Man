import { describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { getResearchRun, listResearchRunSummaries, listResearchRuns, saveResearchRun } from "./research-run-store";

describe("research run storage", () => {
  it("loads only the latest snapshot for its owner", () => {
    const db = drizzle({} as D1Database, { schema });
    const query = listResearchRuns(db, "owner-1").toSQL();
    expect(query.sql).toContain('from "research_runs"');
    expect(query.sql).toContain('"research_runs"."owner_id" = ?');
    expect(query.sql).toContain('order by "research_runs"."created_at" desc, "research_runs"."id" desc');
    expect(query.sql).toContain("limit ?");
    expect(query.params).toEqual(["owner-1", 1]);
  });

  it("lists a bounded archive index without loading result payloads", () => {
    const db = drizzle({} as D1Database, { schema });
    const query = listResearchRunSummaries(db, "owner-1").toSQL();
    expect(query.sql).toContain('select "id", "topic", "geography", "created_at"');
    expect(query.sql).not.toContain('"research_runs"."result"');
    expect(query.sql).toContain('"research_runs"."owner_id" = ?');
    expect(query.params).toEqual(["owner-1", 20]);
  });

  it("loads one archived run by owner and ID", () => {
    const db = drizzle({} as D1Database, { schema });
    const query = getResearchRun(db, "owner-1", "run-1").toSQL();
    expect(query.sql).toContain('"research_runs"."owner_id" = ? and "research_runs"."id" = ?');
    expect(query.params).toEqual(["owner-1", "run-1", 1]);
  });

  it("batches insertion and owner-scoped retention", async () => {
    const db = drizzle({} as D1Database, { schema });
    const batch = vi.spyOn(db, "batch").mockResolvedValue([] as never);
    await saveResearchRun(db, {
      id: "run-1", ownerId: "owner-1", topic: "cafes", geography: "Goa, India", currency: "INR", input: {}, result: {},
    });

    expect(batch).toHaveBeenCalledOnce();
    const [insert, prune] = batch.mock.calls[0][0] as unknown as readonly { toSQL(): { sql: string; params: unknown[] } }[];
    expect(insert.toSQL().sql).toContain('insert into "research_runs"');
    const query = prune.toSQL();
    expect(query.sql).toContain('delete from "research_runs"');
    expect(query.sql).toContain("not in");
    expect(query.sql).toContain("limit ?");
    expect(query.params).toContain("owner-1");
    expect(query.params).toContain(20);
  });

  it("rejects snapshots above the D1 row budget before writing", async () => {
    const db = drizzle({} as D1Database, { schema });
    const batch = vi.spyOn(db, "batch");
    await expect(saveResearchRun(db, {
      id: "run-large", ownerId: "owner-1", topic: "cafes", geography: "Goa, India", currency: "INR", input: {}, result: { text: "x".repeat(1_900_000) },
    })).rejects.toThrow("Research snapshot exceeds the D1 row budget");
    expect(batch).not.toHaveBeenCalled();
  });
});
