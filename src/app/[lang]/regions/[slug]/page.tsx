import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RegionPageView } from "@/components/region/RegionPageView";
import { getRegionPage, getRegionSlugs } from "@/content";
import { getDictionary, isLang, langs, localizedPath } from "@/i18n";
import { topicRobots } from "@/lib/seo";

// One template for every region (spacing-layout-system.md 7C.2 Paths, Region row; DR-411).
// Built at build time for bn and en. An unknown slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return langs.flatMap((lang) =>
    getRegionSlugs().map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/regions/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const page = getRegionPage(lang, slug);
  if (!page) return {};
  return {
    title: getDictionary(lang).regions[page.region],
    // Fewer than 3 stories: noindex, follow, as the topic page (layout 7E; DR-432).
    robots: topicRobots(page.stories.length),
    alternates: {
      languages: {
        bn: localizedPath("bn", `/regions/${slug}`),
        en: localizedPath("en", `/regions/${slug}`),
      },
    },
  };
}

export default async function RegionRoute({
  params,
}: PageProps<"/[lang]/regions/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const page = getRegionPage(lang, slug);
  if (!page) notFound();
  return <RegionPageView page={page} />;
}
