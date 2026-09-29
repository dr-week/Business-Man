import { describe, expect, it } from "vitest";
import { filterOfficialSources, officialSources } from "./official-sources";

describe("official source directory", () => {
  it("surfaces challenge calls as distinct buyer-problem leads", () => {
    expect(filterOfficialSources("Challenges", "deadline")).toEqual([
      expect.objectContaining({
        name: "Startup India challenges",
        signal: "Problem · deadline · incentive",
        limit: "Prize ≠ paid demand",
      }),
    ]);
  });

  it("filters category and text without hiding risk caveats", () => {
    expect(filterOfficialSources("Buyers", "tender").map((source) => source.limit)).toEqual(["Tender ≠ awarded sale"]);
    expect(filterOfficialSources("Funding", "approval").map((source) => source.name)).toEqual(["myScheme"]);
  });

  it("does not imply every government dataset exposes an API", () => {
    expect(filterOfficialSources("Markets", "API").find((source) => source.name === "Open Government Data")?.limit)
      .toBe("API availability and freshness vary by dataset");
  });

  it("keeps every directory target on HTTPS", () => {
    expect(officialSources.every((source) => new URL(source.url).protocol === "https:")).toBe(true);
  });
});
