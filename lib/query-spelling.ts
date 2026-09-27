// Curated corrections; unknown names stay unchanged. No model or external requests.
const vocabulary = `manufacturing fabrication business opportunities mobile repair commercial laundry service solar panel installation pet grooming cold storage warehouse packaging material wholesale empty garage sawdust welding equipment bakery franchise coconut shells banana leaves printer protein powder restaurant inventory recycling tailoring furniture textile transport tourism trekking rental agriculture clinic pharmacy distribution metal sheet water treatment catering cleaning machinery medical retail software irrigation compost mushroom dairy poultry automobile`.split(" ");
const known = new Set(vocabulary);
const corrections: Record<string, string> = {
  protien: "protein", powdr: "powder", manufactring: "manufacturing", manufaturing: "manufacturing",
  cocunut: "coconut", shels: "shells", prnter: "printer", moblie: "mobile", repar: "repair",
  comercial: "commercial", laundary: "laundry", servce: "service", soler: "solar", instalation: "installation",
  groomng: "grooming", storag: "storage", warehosue: "warehouse", packging: "packaging", materal: "material",
  wholesle: "wholesale", emty: "empty", garaj: "garage", sawdst: "sawdust", weldng: "welding",
  equpment: "equipment", bakry: "bakery", franchse: "franchise", busines: "business", busness: "business",
  resturant: "restaurant", invetory: "inventory", recyling: "recycling", tailroing: "tailoring",
  furntiure: "furniture", texitle: "textile", trasnport: "transport", tourisim: "tourism", rentel: "rental",
  agricuture: "agriculture", clinci: "clinic", pharmcy: "pharmacy", distrbution: "distribution",
};
function deletes(word: string) { return [word, ...Array.from(word, (_, i) => word.slice(0, i) + word.slice(i + 1))]; }
// Symmetric-delete candidate index; not the upstream SymSpell package.
const index = new Map<string, Set<string>>();
for (const word of known) for (const key of deletes(word)) {
  if (!index.has(key)) index.set(key, new Set());
  index.get(key)!.add(word);
}
export type QueryEdit = { from: string; to: string };
export function correctQuery(text: string, protectedTerms: string[] = []) {
  const protectedWords = new Set(protectedTerms.flatMap((term) => term.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []));
  const edits: QueryEdit[] = [];
  const suggestions: { word: string; options: string[] }[] = [];
  const corrected = text.replace(/[\p{L}\p{N}]+/gu, (token, offset: number) => {
    const word = token.toLowerCase();
    const prefix = text.slice(0, offset);
    if (!/^[a-z]+$/i.test(token) || /[A-Z]/.test(token) || word.length < 4 || word.length > 32 || protectedWords.has(word) || /\b(?:in|near|at|brand|called)\s+$/i.test(prefix)) return token;
    if (corrections[word]) { edits.push({ from: token, to: corrections[word] }); return corrections[word]; }
    if (known.has(word)) return token;
    const candidates = new Set(deletes(word).flatMap((key) => [...(index.get(key) ?? [])]));
    if (candidates.size) suggestions.push({ word: token, options: [...candidates].sort().slice(0, 3) });
    return token;
  });
  if (/\bflower mill\b/i.test(text)) suggestions.push({ word: "flower mill", options: ["flour mill", "flower business"] });
  return { corrected, edits, suggestions: suggestions.slice(0, 5) };
}
