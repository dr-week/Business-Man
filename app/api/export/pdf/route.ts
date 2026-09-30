// src/app/api/export/pdf/route.ts
// API route to generate a PDF report from research data.
// This endpoint expects a POST with JSON payload containing `title` and `sections`.
// Each section is an object: { heading: string, content: string }.
// It returns a PDF buffer as application/pdf.

import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const { title, sections } = await request.json();
    if (!title || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const page = pdfDoc.addPage();
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
      const words = sec.content.split(' ');
      let line = '';
      for (const word of words) {
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
    return new NextResponse(pdfBytes, {
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
