import { PDFDocument, StandardFonts } from "pdf-lib";

type BountyReportData = {
  id: string;
  opportunityName: string;
  falsificationTarget: string;
  rewardAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
};

export async function createBountyReportPdf(bounty: BountyReportData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  let page = document.addPage();
  const margin = 48;
  const lineHeight = 18;
  let y = page.getHeight() - margin;
  const writeParagraph = (text: string, size = 12) => {
    const maxWidth = page.getWidth() - margin * 2;
    const words = text.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        writeLine(line, size);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) writeLine(line, size);
  };
  const writeLine = (text: string, size: number) => {
    if (y < margin) {
      page = document.addPage();
      y = page.getHeight() - margin;
    }
    page.drawText(text, { x: margin, y, size, font });
    y -= lineHeight;
  };

  writeParagraph("Businessman | Research bounty report", 18);
  y -= 8;
  writeParagraph(`Opportunity: ${bounty.opportunityName}`);
  writeParagraph(`Research question: ${bounty.falsificationTarget}`);
  writeParagraph(`Reward: ${bounty.rewardAmount} ${bounty.currency}`);
  writeParagraph(`Status: ${bounty.status}`);
  writeParagraph(`Created: ${bounty.createdAt}`);
  writeParagraph(`Expires: ${bounty.expiresAt ?? "No expiry"}`);
  writeParagraph(`Bounty ID: ${bounty.id}`);
  y -= 8;
  writeParagraph("This report describes a research task and reward; it does not verify submitted evidence.", 10);
  return document.save();
}
