import { publicRelatedListSchema } from "@fact-lens/contracts";
import type { ReadNextItem } from "@/content";
import type { Lang } from "@/content/types";
import { storyFromListItem } from "./adapters";
import { apiGet, ApiNotFound } from "./client";

export async function readNextFromApi(ref: string, lang: Lang): Promise<ReadNextItem[]> {
  try {
    const result = await apiGet(
      `/public/news/${lang}/${encodeURIComponent(ref)}/related?limit=3`,
      publicRelatedListSchema,
    );
    return result.items.flatMap((item) => {
      const story = storyFromListItem(item, lang);
      return story ? [{ story }] : [];
    });
  } catch (error) {
    if (error instanceof ApiNotFound) return [];
    console.warn("Could not load related stories", { ref, lang, error });
    return [];
  }
}
