import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { createBountyReportPdf } from "./bounty-report";

describe("bounty PDF report", () => {
  it("produces a readable PDF document from a bounty record", async () => {
    const pdf = await createBountyReportPdf({
      id: "bounty-1",
      opportunityName: "Rural cold storage",
      falsificationTarget: "Verify current local operating costs and buyer demand.",
      rewardAmount: 2500,
      currency: "INR",
      status: "open",
      createdAt: "2026-10-01",
      expiresAt: null,
    });

    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
    const document = await PDFDocument.load(pdf);
    expect(document.getPageCount()).toBe(1);
  });
});
