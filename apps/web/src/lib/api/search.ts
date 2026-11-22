import { publicSearchSchema, publicTrendingSchema } from "@fact-lens/contracts";
import type { Lang, Story } from "@/content/types";
import { storyFromListItem } from "./adapters";
import { clientAddressHeaders } from "@/lib/client-address";
import { apiGet, apiLocale } from "./client";

export async function searchFromApi(
  query: string,
  lang: Lang,
  cursor?: string,
  address: string | null = null,
): Promise<{ query: string; stories: Story[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ q: query, limit: "10" });
  if (cursor) params.set("cursor", cursor);
  // The reader's address, as the site vouches for it, so the API's search limit counts per reader.
  const result = await apiGet(
    `/public/search/${apiLocale(lang)}?${params.toString()}`,
    publicSearchSchema,
    { headers: clientAddressHeaders(address) },
  );
  return {
    query: result.query,
    stories: result.items.flatMap((item) => {
      const story = storyFromListItem(item, lang);
      return story ? [story] : [];
    }),
    nextCursor: result.nextCursor,
  };
}

export async function trendingFromApi(lang: Lang): Promise<string[]> {
  try {
    const result = await apiGet(
      `/public/trending-searches/${apiLocale(lang)}`,
      publicTrendingSchema,
    );
    return result.terms;
  } catch {
    // The header and the dialog still open without trending terms, whatever went wrong.
    return [];
  }
}
