import { describe, expect, it } from "vitest";
import { groupSources } from "./source-grouping";
import type { SourceSignal } from "./discovery";

const source = (id: string, title: string, url = `https://example.com/${id}`): SourceSignal => ({
  id, title, url, provider: "Forum", excerpt: "We spend time on this every week.",
  publishedAt: "2026-01-01", retrievedAt: "2026-09-29", comments: 1,
});

describe("source grouping", () => {
  it("merges different wording for the same problem and retains independent links", () => {
    const groups = groupSources([
      source("1", "How to track restaurant inventory?"),
      source("2", "Managing restaurant inventory"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((item) => item.id)).toEqual(["1", "2"]);
  });
  it("does not merge distinct buyers on one shared noun", () => {
    expect(groupSources([
      source("1", "Restaurant inventory errors"),
      source("2", "Hospital inventory errors"),
    ])).toHaveLength(2);
  });
  it("deduplicates tracking URLs without dropping first source", () => {
    const groups = groupSources([
      source("1", "Restaurant inventory errors", "https://example.com/post?utm_source=feed"),
      source("2", "Restaurant inventory errors", "https://example.com/post"),
    ]);
    expect(groups.flat()).toHaveLength(1);
    expect(groups[0][0].id).toBe("1");
  });
  it("keeps malformed or non-web URLs as distinct sources without throwing", () => {
    const groups = groupSources([
      source("1", "Restaurant inventory errors", "not a url"),
      source("2", "Restaurant inventory errors", "not a url"),
      source("3", "Restaurant inventory errors", "javascript:alert(1)"),
    ]);
    expect(groups.flat().map(({ id }) => id)).toEqual(["1", "3"]);
  });
  it("bounds work and retained results for oversized provider input", () => {
    const items = Array.from({ length: 510 }, (_, index) => source(String(index), `Unique buyer problem ${index}`));
    const groups = groupSources(items);
    expect(groups.flat()).toHaveLength(500);
    expect(groups.flat().at(-1)?.id).toBe("499");
  });
});
