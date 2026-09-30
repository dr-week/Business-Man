// workers/pdfExportWorker.ts
// Premium PDF export worker that generates a simple report and adds a watermark.
// This module demonstrates a high‑value, monetizable feature guarded by the license guard.

import { promises as fs } from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { verifyLicenseToken } from "../lib/licenseGuard.js"; // path relative to workers folder

/**
 * Generate a PDF report from JSON data and embed a watermark.
 *
 * @param data The report data – an array of objects with `title` and `value` fields.
 * @param outputPath File path where the PDF will be written.
 * @param licenseToken JWT token that must include a premium claim.
 */
export async function generatePremiumPdf(
  data: { title: string; value: string | number }[],
  outputPath: string,
  licenseToken: string,
): Promise<void> {
  // Verify premium license before proceeding.
  const ok = await verifyLicenseToken(licenseToken);
  if (!ok) {
    throw new Error("Invalid or non‑premium license token");
  }

  // Create a new PDF document.
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  // Write title.
  page.drawText("Report", {
    x: 50,
    y: height - 50,
    size: 24,
    font,
    color: rgb(0, 0, 0),
  });

  // Render each data row.
  let yOffset = height - 80;
  for (const item of data) {
    const line = `${item.title}: ${item.value}`;
    page.drawText(line, {
      x: 50,
      y: yOffset,
      size: fontSize,
      font,
      color: rgb(0, 0, 0.2),
    });
    yOffset -= 20;
  }

  // Add semi‑transparent watermark across the page.
  const watermark = "Premium Licensed Copy";
  const watermarkFontSize = 48;
  const watermarkFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textWidth = watermarkFont.widthOfTextAtSize(watermark, watermarkFontSize);
  const textHeight = watermarkFont.heightAtSize(watermarkFontSize);
  const watermarkX = (width - textWidth) / 2;
  const watermarkY = (height - textHeight) / 2;

  page.drawText(watermark, {
    x: watermarkX,
    y: watermarkY,
    size: watermarkFontSize,
    font: watermarkFont,
    color: rgb(0.8, 0.8, 0.8),
    rotate: degrees(45),
    opacity: 0.3,
  });

  // Serialize the PDF to bytes and write to disk.
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
}

/** Helper to convert degrees for pdf-lib */
function degrees(angle: number) {
  return (angle * Math.PI) / 180;
}

// If executed directly, run a demo (useful for manual verification).
if (import.meta.url.endsWith(process.argv[1])) {
  const demoData = [
    { title: "Revenue", value: "$123,456" },
    { title: "Opportunities", value: 42 },
    { title: "Score", value: 87 },
  ];
  const token = process.env.PREMIUM_TOKEN || "";
  generatePremiumPdf(demoData, "./premium_report.pdf", token)
    .then(() => console.log("Premium PDF generated at ./premium_report.pdf"))
    .catch((e) => console.error(e));
}
