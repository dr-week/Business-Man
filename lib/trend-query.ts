/** Compare common spellings of maxxing slang without treating search interest as demand. */
export function trendQueryTerms(topic: string): string[] {
  const match = topic.trim().match(/\b([a-z][a-z-]{1,35})\s+maxx+(?:ing|ig)\b/i);
  if (!match) return [topic.trim().slice(0, 100)];
  const stem = match[1];
  return [`${stem} maxxing`, `${stem} maxing`];
}
