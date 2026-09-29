/** A conservative label for source content. Unknown content stays unclassified. */
const industries = [
  ["Agriculture", /\b(?:farm(?:ing|er|s)?|crop|harvest|orchard|irrigation|livestock|poultry|mushroom)\b/i],
  ["Healthcare", /\b(?:hospital|clinic|pharma(?:ceutical)?|medicine|medical|patient)\b/i],
  ["Manufacturing", /\b(?:manufactur(?:e|ing)|fabricat(?:e|ion)|assembly line|factory|machin(?:e|ing)|metal sheet|3d[- ]print(?:er|ing|ed)?)\b/i],
  ["Food", /\b(?:food process(?:ing)?|restaurant|bakery|catering|packaged food)\b/i],
  ["Travel", /\b(?:tourism|trekking|travel agency|hotel|hospitality)\b/i],
  ["Logistics", /\b(?:warehouse|freight|shipping|delivery|logistics|transportation)\b/i],
  ["Retail", /\b(?:retail|storefront|shopkeeper|ecommerce|e-commerce)\b/i],
  ["Software", /\b(?:software|saas|application|app developer|api|coding|programming)\b/i],
] as const;

export function classifyIndustry(text: string): string {
  return industries.find(([, pattern]) => pattern.test(text))?.[0] ?? "Unclassified";
}

export function matchesIndustry(filter: string, category: string, text: string): boolean {
  const requested = filter.trim().toLowerCase();
  if (!requested) return true;
  const known = industries.find(([label]) => label.toLowerCase() === requested);
  if (known) return category === known[0];
  return (category + " " + text).toLowerCase().includes(requested);
}
