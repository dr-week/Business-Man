import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { POST } from "./route";

describe("PDF report export", () => {
  it("exports large report sections across pages", async () => {
    const content = Array.from({ length: 900 }, (_, index) => `evidence${index % 90}`).join(" ");
    const response = await POST(new Request("http://localhost/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Market report", sections: [
        { heading: "Evidence 1", content },
        { heading: "Evidence 2", content },
      ] }),
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    const pdf = await PDFDocument.load(await response.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
