import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalysisPageView } from "@/components/analysis/AnalysisPageView";
import { getAnalysisPage } from "@/content";
import { getDictionary, isLang, localizedPath } from "@/i18n";

// The analysis hub (spacing-layout-system.md 7C.2 Paths, Analysis hub row). Built at build
// time for bn and en: the [lang] layout gives the params.

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/analysis">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: t.analysisOpinion.analysis,
    description: t.analysisPage.description,
    alternates: {
      languages: {
        bn: localizedPath("bn", "/analysis"),
        en: localizedPath("en", "/analysis"),
      },
    },
  };
}

export default async function AnalysisRoute({
  params,
}: PageProps<"/[lang]/analysis">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <AnalysisPageView page={getAnalysisPage(lang)} />;
}
