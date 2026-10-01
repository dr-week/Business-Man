import { z } from "zod";
import { readLimitedJson } from "@/lib/read-limited-json";

const placeSchema = z.object({
  id: z.string().min(1).max(200),
  displayName: z.object({ text: z.string().max(300) }).optional(),
  formattedAddress: z.string().max(500).optional(),
  primaryTypeDisplayName: z.object({ text: z.string().max(120) }).optional(),
  googleMapsUri: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  businessStatus: z.enum(["OPERATIONAL", "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY", "FUTURE_OPENING", "BUSINESS_STATUS_UNSPECIFIED"]).optional(),
  priceLevel: z.enum(["PRICE_LEVEL_UNSPECIFIED", "PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", "PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"]).optional(),
});
const responseSchema = z.object({ places: z.array(placeSchema).max(20).optional() });

export type LocalCompetitor = {
  id: string; name: string; address: string; category: string; mapUrl: string | null;
  rating: number | null; ratingCount: number | null;
  businessStatus: z.infer<typeof placeSchema>["businessStatus"] | null;
  priceLevel: z.infer<typeof placeSchema>["priceLevel"] | null;
};

/** Optional Google Places candidate finder. Results are not proof of demand or market coverage. */
export async function collectLocalCompetitors(input: { topic: string; geography: string; key?: string }, signal?: AbortSignal): Promise<LocalCompetitor[]> {
  if (!input.key) return [];
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST", redirect: "manual", signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(8000)]),
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": input.key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.googleMapsUri,places.rating,places.userRatingCount,places.businessStatus,places.priceLevel" },
    body: JSON.stringify({ textQuery: `${input.topic.slice(0, 100)} in ${input.geography.slice(0, 100)}`, pageSize: 10 }),
  });
  if (!response.ok) throw new Error(`Places search unavailable (${response.status})`);
  const parsed = responseSchema.parse(await readLimitedJson(response, 128_000));
  return (parsed.places ?? []).map((place) => ({
    id: place.id, name: place.displayName?.text ?? "Unnamed place", address: place.formattedAddress ?? "Address unavailable",
    category: place.primaryTypeDisplayName?.text ?? "Category unavailable", mapUrl: place.googleMapsUri ?? null,
    rating: place.rating ?? null, ratingCount: place.userRatingCount ?? null,
    businessStatus: place.businessStatus && place.businessStatus !== "BUSINESS_STATUS_UNSPECIFIED" ? place.businessStatus : null,
    priceLevel: place.priceLevel && place.priceLevel !== "PRICE_LEVEL_UNSPECIFIED" ? place.priceLevel : null,
  }));
}
