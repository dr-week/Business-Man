import { performance } from "node:perf_hooks";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { wrapReportText } from "../lib/reporting/pdf-text-layout";

function previousWrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const match of text.matchAll(/\S+/g)) {
    const word = match[0];
    const candidate = line + (line ? " " : "") + word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

const document = await PDFDocument.create();
const font = await document.embedFont(StandardFonts.TimesRoman);
const text = Array.from({ length: 3_000 }, (_, index) => `market research evidence source ${index % 71} validation`).join(" ");
const measure = (run: () => string[]) => {
  const start = performance.now();
  const lines = run();
  return { milliseconds: +(performance.now() - start).toFixed(2), lines: lines.length };
};

// Warm both code paths before timing the same representative report section.
previousWrap(text.slice(0, 2_000), font, 12, 512);
wrapReportText(text.slice(0, 2_000), font, 12, 512);
const before = measure(() => previousWrap(text, font, 12, 512));
const after = measure(() => wrapReportText(text, font, 12, 512));
if (before.lines !== after.lines) throw new Error(`Line mismatch: ${before.lines} vs ${after.lines}`);
console.log(JSON.stringify({ words: 3_000 * 6, previous: before, optimized: after, speedup: +(before.milliseconds / after.milliseconds).toFixed(2) }, null, 2));
