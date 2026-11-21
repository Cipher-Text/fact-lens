import type { MetadataRoute } from "next";
import { publicNewsListSchema } from "@fact-lens/contracts";
import { categoryIds, regionIds } from "@/content/types";
import { langs, localizedPath } from "@/i18n/config";
import { apiGet, apiLocale } from "@/lib/api/client";

export async function sitemapEntries(origin: string): Promise<MetadataRoute.Sitemap> {
  const paths = langs.flatMap((lang) => [
    localizedPath(lang),
    localizedPath(lang, "/analysis"),
    localizedPath(lang, "/regions"),
    localizedPath(lang, "/latest"),
    ...categoryIds.map((id) => localizedPath(lang, `/category/${id}`)),
    ...regionIds.map((id) => localizedPath(lang, `/regions/${id}`)),
  ]);
  const entries: MetadataRoute.Sitemap = paths.map((path) => ({ url: `${origin}${path}` }));

  for (const lang of langs) {
    let cursor: string | undefined;
    let count = 0;
    try {
      do {
        const query = new URLSearchParams({ limit: "50" });
        if (cursor) query.set("cursor", cursor);
        const page = await apiGet(`/public/news/${apiLocale(lang)}?${query}`, publicNewsListSchema);
        for (const item of page.items) {
          if (count >= 5000) break;
          entries.push({
            url: `${origin}${localizedPath(lang, `/story/${item.slug}-${item.shortId}`)}`,
            lastModified: new Date(item.publishedAt),
          });
          count += 1;
        }
        cursor = count >= 5000 ? undefined : page.nextCursor ?? undefined;
      } while (cursor);
    } catch {
      // Keep the static sitemap useful while the public API is unavailable.
    }
  }
  return entries;
}
