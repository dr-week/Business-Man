import { describe, expect, it } from "vitest";
import { sourceAgeLabel } from "./source-freshness";

const now = Date.parse("2026-09-29T00:00:00Z");
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

describe("source publication age", () => {
  it("labels unknown and future dates without treating them as fresh", () => {
    expect(sourceAgeLabel(undefined, now)).toBe("Date unknown");
    expect(sourceAgeLabel("not a date", now)).toBe("Date unknown");
    expect(sourceAgeLabel("2026-09-30T00:00:00Z", now)).toBe("Future date");
  });

  it("uses bounded age bands with explicit day boundaries", () => {
    expect(sourceAgeLabel(daysAgo(90), now)).toBe("Published within 90 days");
    expect(sourceAgeLabel(daysAgo(91), now)).toBe("Published 91–365 days ago");
    expect(sourceAgeLabel(daysAgo(365), now)).toBe("Published 91–365 days ago");
    expect(sourceAgeLabel(daysAgo(366), now)).toBe("Published over 365 days ago");
  });
});
