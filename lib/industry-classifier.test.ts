import { describe, expect, it } from "vitest";
import { classifyIndustry, matchesIndustry } from "./industry-classifier";

describe("industry classification", () => {
  it.each([
    ["oyster mushroom farm", "Agriculture"],
    ["TPU suspension riser made with 3D-printed tooling", "Manufacturing"],
    ["hotel laundry delivery", "Travel"],
  ])("classifies %s as %s", (text, industry) => {
    expect(classifyIndustry(text)).toBe(industry);
  });

  it("leaves unsupported niche language unclassified", () => {
    expect(classifyIndustry("consistent character prompts for image generation")).toBe("Unclassified");
  });

  it("matches known industry labels and free-text filters", () => {
    expect(matchesIndustry("Manufacturing", "Manufacturing", "3D-printed part")).toBe(true);
    expect(matchesIndustry("Manufacturing", "Software", "3D-printed part")).toBe(false);
    expect(matchesIndustry("Goa", "Agriculture", "oyster mushroom farm in Goa")).toBe(true);
    expect(matchesIndustry("", "Unclassified", "anything")).toBe(true);
  });
});
