import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LatestPageView } from "@/components/latest/LatestPageView";
import { getLatestPage } from "@/content";
import { getDictionary, isLang, localizedPath } from "@/i18n";

// The news hub (spacing-layout-system.md 7C.2 Paths, News hub row). Built at build time for bn and en: the
// [lang] layout gives the params.

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/latest">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: getDictionary(lang).hero.latest,
    alternates: {
      languages: {
        bn: localizedPath("bn", "/latest"),
        en: localizedPath("en", "/latest"),
      },
    },
  };
}

export default async function LatestRoute({
  params,
}: PageProps<"/[lang]/latest">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <LatestPageView page={getLatestPage(lang)} />;
}
