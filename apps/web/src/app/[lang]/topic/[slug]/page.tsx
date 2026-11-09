import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TopicPageView } from "@/components/topic/TopicPageView";
import { getTopicPage, getTopicSlugs } from "@/content";
import { isLang, langs, localizedPath } from "@/i18n";
import { topicRobots } from "@/lib/seo";

// One template for every topic (spacing-layout-system.md 7C.2 Paths, Topic row; DR-410).
// Built at build time for bn and en. An unknown slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return langs.flatMap((lang) =>
    getTopicSlugs().map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/topic/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const page = getTopicPage(lang, slug);
  if (!page) return {};
  return {
    title: page.topic.label,
    // Fewer than 3 stories: noindex, follow (layout 7E; DR-432).
    robots: topicRobots(page.stories.length),
    alternates: {
      languages: {
        bn: localizedPath("bn", `/topic/${slug}`),
        en: localizedPath("en", `/topic/${slug}`),
      },
    },
  };
}

export default async function TopicRoute({
  params,
}: PageProps<"/[lang]/topic/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const page = getTopicPage(lang, slug);
  if (!page) notFound();
  return <TopicPageView page={page} />;
}
