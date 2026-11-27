import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";
import { sitemapEntries } from "@/lib/sitemap";

// Rendered on request: the sitemap lists the API's content, so it is not built while the API is down.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  return origin ? sitemapEntries(origin) : [];
}
