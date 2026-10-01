import { describe, expect, it, vi } from "vitest";
import { wrapReportText } from "./pdf-text-layout";

describe("wrapReportText", () => {
  it("wraps words at the requested width and measures each word once", () => {
    const widthOfTextAtSize = vi.fn((text: string) => text.length);

    expect(wrapReportText("alpha beta gamma", { widthOfTextAtSize }, 10, 10)).toEqual([
      "alpha beta",
      "gamma",
    ]);
    expect(widthOfTextAtSize).toHaveBeenCalledTimes(4); // Three words plus one space.
  });

  it("returns no lines for empty or whitespace-only input", () => {
    const font = { widthOfTextAtSize: vi.fn(() => 1) };
    expect(wrapReportText(" \n\t ", font, 10, 10)).toEqual([]);
    expect(font.widthOfTextAtSize).not.toHaveBeenCalled();
  });
});
