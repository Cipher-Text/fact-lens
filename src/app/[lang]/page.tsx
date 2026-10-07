import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/header/SiteHeader";
import { AnalysisOpinion } from "@/components/home/analysis-opinion/AnalysisOpinion";
import { Hero } from "@/components/home/hero/Hero";
import { AdRow } from "@/components/layout/AdRow";
import { getHomepage } from "@/content";
import { getDictionary, isLang } from "@/i18n";
import { cn } from "@/lib/utils";

// Homepage. Page order: spacing-layout-system.md Section 7.1.
// ?content=sparse shows the sparse cases of Section 7.3 (IMP-11).
export default async function HomePage({
  params,
  searchParams,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { content } = await searchParams;
  const t = getDictionary(lang);
  const home = getHomepage(lang, {
    variant: content === "sparse" ? "sparse" : "full",
  });

  return (
    <>
      <AdRow slot="ad-band-top" strings={t.ads} />
      <SiteHeader lang={lang} />
      <main id="main" className="pt-(--space-page-start)">
        <h1 className="sr-only">{t.home.title}</h1>
        {/* A hidden section also hides its ad row (Section 7.3, LAY-13). The space
            before the ad row belongs to the section (LAY-12). */}
        {home.hero ? (
          <>
            <Hero
              lang={lang}
              hero={home.hero}
              t={t}
              className="pb-(--space-module)"
            />
            <AdRow slot="ad-band" strings={t.ads} />
          </>
        ) : null}
        {home.analysisOpinion ? (
          <>
            {/* P-4 has its own background, so its space to the ad rows is margin
                outside the background (LAY-12). After the header, main sets
                space-page-start. */}
            <AnalysisOpinion
              lang={lang}
              section={home.analysisOpinion}
              t={t}
              className={cn(
                home.hero && "mt-(--space-module)",
                "mb-(--space-module)",
              )}
            />
            <AdRow slot="ad-band" strings={t.ads} />
          </>
        ) : null}
      </main>
    </>
  );
}
