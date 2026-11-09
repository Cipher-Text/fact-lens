import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RegionsPageView } from "@/components/region-hub/RegionsPageView";
import { getRegionsPage } from "@/content";
import { getDictionary, isLang, localizedPath } from "@/i18n";

// The region hub (spacing-layout-system.md 7C.2 Paths, Region hub row). Built at build
// time for bn and en: the [lang] layout gives the params.

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/regions">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.regionsSection.title,
    description: t.regionsPage.description,
    alternates: {
      languages: {
        bn: localizedPath("bn", "/regions"),
        en: localizedPath("en", "/regions"),
      },
    },
  };
}

export default async function RegionsRoute({
  params,
}: PageProps<"/[lang]/regions">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <RegionsPageView page={getRegionsPage(lang)} />;
}
