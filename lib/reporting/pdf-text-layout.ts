export interface TextMeasurer {
  widthOfTextAtSize(text: string, size: number): number;
}

/** Wrap whitespace-separated report text with one font measurement per word. */
export function wrapReportText(
  text: string,
  font: TextMeasurer,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.match(/\S+/g) ?? [];
  if (!words.length) return [];
  const lines: string[] = [];
  const spaceWidth = font.widthOfTextAtSize(" ", fontSize);
  let line = "";
  let lineWidth = 0;

  for (const word of words) {
    const wordWidth = font.widthOfTextAtSize(word, fontSize);
    const nextWidth = lineWidth + (line ? spaceWidth : 0) + wordWidth;
    if (line && nextWidth > maxWidth) {
      lines.push(line);
      line = word;
      lineWidth = wordWidth;
    } else {
      line = line ? `${line} ${word}` : word;
      lineWidth = nextWidth;
    }
  }

  if (line) lines.push(line);
  return lines;
}
