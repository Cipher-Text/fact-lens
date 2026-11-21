import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";
import { sitemapEntries } from "@/lib/sitemap";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  return origin ? sitemapEntries(origin) : [];
}
