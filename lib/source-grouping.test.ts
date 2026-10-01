import { describe, expect, it } from "vitest";
import { groupSources } from "./source-grouping";
import type { SourceSignal } from "./discovery";

const source = (id: string, title: string, url = `https://example.com/${id}`): SourceSignal => ({
  id, title, url, provider: "Forum", excerpt: "We spend time on this every week.",
  publishedAt: "2026-01-01", retrievedAt: "2026-09-29", comments: 1,
});

const referenceGrouping = (sources: SourceSignal[]) => {
  const noise = new Set("about after again anyone best business can could does error errors find for from have help how into issue issues looking manage managed management managing need problem problems should solve solving solution solutions that the there these this track tracked tracking what when where which with would your".split(" "));
  const terms = (title: string) => new Set((title.toLowerCase().replace(/^(?:ask hn|show hn)[:?\s-]*/i, "").match(/[a-z0-9]{4,}/g) ?? []).map((word) => word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word).filter((word) => !noise.has(word)));
  const groups: SourceSignal[][] = [];
  for (const item of sources.slice(0, 500)) {
    const itemTerms = terms(item.title);
    const group = groups.find((items) => {
      const firstTerms = terms(items[0].title);
      if (firstTerms.size < 2 || itemTerms.size < 2) return false;
      const shared = [...firstTerms].filter((word) => itemTerms.has(word)).length;
      return shared >= 2 && shared / Math.max(firstTerms.size, itemTerms.size) >= 0.6;
    });
    if (group) group.push(item); else groups.push([item]);
  }
  return groups;
};

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
  it("keeps malformed or non-web records distinct without throwing", () => {
    const groups = groupSources([
      source("1", "Restaurant inventory errors", "not a url"),
      source("2", "Restaurant inventory errors", "not a url"),
      source("3", "Restaurant inventory errors", "javascript:alert(1)"),
    ]);
    expect(groups.flat().map(({ id }) => id)).toEqual(["1", "2", "3"]);
  });
  it("deduplicates canonical URLs with reordered queries and tracking parameters", () => {
    const groups = groupSources([
      source("1", "Restaurant inventory errors", "https://www.example.com/post?b=2&utm_source=mail&a=1#details"),
      source("2", "Restaurant inventory errors", "https://example.com/post?a=1&b=2"),
    ]);
    expect(groups.flat().map(({ id }) => id)).toEqual(["1"]);
  });
  it("does not collapse URL credentials into an invalid-source key", () => {
    const groups = groupSources([
      source("1", "Restaurant inventory errors", "https://user:pass@example.com/post"),
      source("2", "Restaurant inventory errors", "https://user:pass@example.com/post"),
    ]);
    expect(groups.flat().map(({ id }) => id)).toEqual(["1", "2"]);
  });
  it("bounds work and retained results for oversized provider input", () => {
    const items = Array.from({ length: 510 }, (_, index) => source(String(index), `Unique buyer problem ${index}`));
    const groups = groupSources(items);
    expect(groups.flat()).toHaveLength(500);
    expect(groups.flat().at(-1)?.id).toBe("499");
  });
  it("matches exhaustive grouping while blocking unrelated titles", () => {
    const items = Array.from({ length: 500 }, (_, index) => {
      const group = Math.floor(index / 5);
      const letters = (value: number) => String.fromCharCode(97 + Math.floor(value / 26), 97 + value % 26);
      return source(String(index), `segment${letters(group)} friction${letters(group)} case${letters(index)}`);
    });
    expect(groupSources(items).map((group) => group.map(({ id }) => id))).toEqual(
      referenceGrouping(items).map((group) => group.map(({ id }) => id)),
    );
  });
});
