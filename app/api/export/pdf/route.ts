// src/app/api/export/pdf/route.ts
// API route to generate a PDF report from research data.
// This endpoint expects a POST with JSON payload containing `title` and `sections`.
// Each section is an object: { heading: string, content: string }.
// It returns a PDF buffer as application/pdf.

import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readLimitedJson } from '@/lib/read-limited-json';
import { z } from 'zod';

const reportInput = z.object({
  title: z.string().trim().min(1).max(120),
  sections: z.array(z.object({
    heading: z.string().trim().min(1).max(200),
    content: z.string().max(12_000),
  }).strict()).min(1).max(100),
}).strict();

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await readLimitedJson(request, 512_000); }
    catch {
      return NextResponse.json({ error: 'Invalid or oversized report payload' }, { status: 400 });
    }
    const parsed = reportInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { title, sections } = parsed.data;

    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Title
    const titleFontSize = 24;
    page.drawText(title, {
      x: margin,
      y: y - titleFontSize,
      size: titleFontSize,
      font: timesRoman,
      color: rgb(0, 0, 0.8),
    });
    y -= titleFontSize + 20;

    const headingFontSize = 16;
    const contentFontSize = 12;
    const lineHeight = 14;

    for (const sec of sections) {
      // Heading
      page.drawText(sec.heading, {
        x: margin,
        y: y - headingFontSize,
        size: headingFontSize,
        font: timesRoman,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= headingFontSize + 6;

      // Content (wrap manually)
      let line = '';
      for (const match of sec.content.matchAll(/\S+/g)) {
        const word = match[0];
        const testLine = line + (line ? ' ' : '') + word;
        const textWidth = timesRoman.widthOfTextAtSize(testLine, contentFontSize);
        if (textWidth > width - 2 * margin) {
          page.drawText(line, {
            x: margin,
            y: y - contentFontSize,
            size: contentFontSize,
            font: timesRoman,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
          line = word;
        } else {
          line = testLine;
        }
        if (y < margin) {
          // Add new page if out of space
          const newPage = pdfDoc.addPage();
          y = height - margin;
          page = newPage;
        }
      }
      if (line) {
        page.drawText(line, {
          x: margin,
          y: y - contentFontSize,
          size: contentFontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }
      y -= 10; // spacing between sections
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // Suggest a filename
        'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (e) {
    console.error('PDF generation error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
