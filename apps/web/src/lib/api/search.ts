import { publicSearchSchema, publicTrendingSchema } from "@fact-lens/contracts";
import type { Lang, Story } from "@/content/types";
import { storyFromListItem } from "./adapters";
import { apiGet, apiLocale } from "./client";

export async function searchFromApi(
  query: string,
  lang: Lang,
  cursor?: string,
): Promise<{ query: string; stories: Story[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ q: query, limit: "20" });
  if (cursor) params.set("cursor", cursor);
  const result = await apiGet(
    `/public/search/${apiLocale(lang)}?${params.toString()}`,
    publicSearchSchema,
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
