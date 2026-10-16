import { notFound } from "next/navigation";
import { Fragment } from "react";

import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { AnalysisSection } from "@/components/home/analysis/AnalysisSection";
import { FeaturedCategorySection } from "@/components/home/featured/FeaturedCategorySection";
import { GroupedCategoriesSection } from "@/components/home/grouped/GroupedCategoriesSection";
import { HeroSection } from "@/components/home/hero/HeroSection";
import { MostReadSection } from "@/components/home/most-read/MostReadSection";
import { RegionsSection } from "@/components/home/regions/RegionsSection";
import { AdSlot } from "@/components/ads/AdSlot";
import { getHomepage } from "@/content";
import { getDictionary, isLang } from "@/i18n";
import { cn } from "@/lib/utils";

// The page reads searchParams, so it renders on each request: the footer year is the
// year of the request, not of the build (DR-332).
// Homepage. Page order: spacing-layout-system.md Section 7.1.
// ?content=sparse shows the sparse cases of Section 7.3, in development only (IMP-11).
export default async function HomePage({
  params,
  searchParams,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { content } = await searchParams;
  const t = getDictionary(lang);
  const home = getHomepage(lang, {
    variant:
      process.env.NODE_ENV !== "production" && content === "sparse"
        ? "sparse"
        : "full",
  });
  const featured = [home.featured.bangladesh, home.featured.geopolitics].filter(
    (section) => section !== null,
  );
  // P-3b follows an ad row when P-5, or a section with an ad row and no P-3 after it,
  // comes before it. After P-3 alone, P-3's space-section is above it.
  const regionsAfterAdRow =
    home.mostRead !== null ||
    (!home.grouped &&
      (featured.length > 0 || !!home.hero || !!home.analysisOpinion));

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} />
      {/* The top ad row is below the header: below the nav row from 1280, below the
          top bar under 1280 (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={t.ads} />
      {/* tabIndex -1: the SkipLink target takes focus in every browser (DR-269). */}
      <main
        id="main"
        tabIndex={-1}
        className="pt-(--space-page-start) focus-visible:outline-none"
      >
        <h1 className="sr-only">{t.home.title}</h1>
        {/* A hidden section also hides its ad row (Section 7.3, LAY-13). The space
            before the ad row belongs to the section (LAY-12). */}
        {home.hero ? (
          <>
            <HeroSection
              hero={home.hero}
              t={t}
              className="pb-(--space-module)"
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </>
        ) : null}
        {home.analysisOpinion ? (
          <>
            {/* P-4 has its own background, so its space to the ad rows is margin
                outside the background (LAY-12). After the header, main sets
                space-page-start. */}
            <AnalysisSection
              lang={lang}
              section={home.analysisOpinion}
              t={t}
              className={cn(
                home.hero && "mt-(--space-module)",
                "mb-(--space-module)",
              )}
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </>
        ) : null}
        {/* P-2 for বাংলাদেশ, then ভূরাজনীতি, each with its ad row (DR-68). */}
        {featured.map((section, index) => (
          <Fragment key={section.category}>
            <FeaturedCategorySection
              lang={lang}
              section={section}
              t={t}
              className={cn(
                // After an ad row: space-module above (LAY-12). First on
                // the page: main sets space-page-start.
                (index > 0 || home.hero || home.analysisOpinion) &&
                  "pt-(--space-module)",
                "pb-(--space-module)",
              )}
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </Fragment>
        ))}
        {/* P-3: no ad row of its own; its ad-inset slots are inside it. P-5 Most read
            follows without an ad row between (7.1), so space-section is below it. */}
        {home.grouped ? (
          <GroupedCategoriesSection
            lang={lang}
            categories={home.grouped.categories}
            poll={home.grouped.poll}
            t={t}
            className={cn(
              (featured.length > 0 || home.hero || home.analysisOpinion) &&
                "pt-(--space-module)",
              "pb-(--space-section)",
            )}
          />
        ) : null}
        {/* P-5 Most read, then its ad row (DR-68). After P-3, the space above is P-3's
            space-section; after an ad row, space-module (LAY-12). */}
        {home.mostRead ? (
          <>
            <MostReadSection
              lang={lang}
              stories={home.mostRead}
              t={t}
              className={cn(
                !home.grouped &&
                  (featured.length > 0 || home.hero || home.analysisOpinion) &&
                  "pt-(--space-module)",
                "pb-(--space-module)",
              )}
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </>
        ) : null}
        {/* P-3b Regions, the last section (7.1). space-module after an ad row (LAY-12);
            space-section below it, before the footer (FL-12). No ad row of its own. */}
        {home.regions ? (
          <RegionsSection
            lang={lang}
            regions={home.regions}
            t={t}
            className={cn(
              regionsAfterAdRow && "pt-(--space-module)",
              "pb-(--space-section)",
            )}
          />
        ) : null}
      </main>
      {/* Row 15: the minimum footer, a full-width row with its content in the shell
          (7.1, 7.4, DR-59). */}
      <Footer lang={lang} />
    </>
  );
}
