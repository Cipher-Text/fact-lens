import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { MostReadSection } from "@/components/home/most-read/MostReadSection";
import { PageTitle } from "@/components/layout/PageTitle";
import type { CategoryPage } from "@/content";
import { getDictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { CategoryFeatureSection } from "./CategoryFeatureSection";
import { CategoryFormatsSection } from "./CategoryFormatsSection";
import { CategoryMoreStoriesSection } from "./CategoryMoreStoriesSection";
import { MissingTranslationNote } from "./MissingTranslationNote";

type Props = {
  page: CategoryPage;
};

/** One template for every category page. Page order: spacing-layout-system.md 7B. */
export function CategoryPageView({ page }: Props) {
  const { lang, category } = page;
  const t = getDictionary(lang);
  const formats = page.analysis.length > 0 || page.opinion.length > 0;
  // More stories follows an ad row only when Most read or the feature ad row is the row
  // before it; after the formats row it follows a section (LAY-12).
  const afterAd =
    page.mostRead.length > 0 || (page.feature !== null && !formats);

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} path={`/category/${category}`} />
      {/* The top ad row is below the header, full width (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={t.ads} />
      {/* tabIndex -1: the SkipLink target takes focus in every browser (DR-269). */}
      <main
        id="main"
        tabIndex={-1}
        className="pb-(--space-section) focus-visible:outline-none"
      >
        {/* The title band is the first row of main, under the ad-top row; it takes the
            place of space-page-start (tajmin, 28 Oct 2026). The missing translation note
            sits in the band, above the title (DR-401): it reads the URL in the browser; the
            page stays static. */}
        <PageTitle
          title={t.categories[category]}
          note={
            <MissingTranslationNote lang={lang} text={t.language.onlyInOther} />
          }
          className="mb-(--space-module)"
        />
        {/* CategoryFeatureSection holds the feature story and the card rows, then its ad row. A section with
            no stories also hides its ad row (7.3, LAY-13). The space before the ad row
            belongs to the section (LAY-12). */}
        {page.feature ? (
          <>
            <CategoryFeatureSection
              feature={page.feature}
              latest={page.latest}
              cards={page.cards}
              t={t}
              className="pb-(--space-module)"
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </>
        ) : null}
        {/* Analysis and opinion, directly above Most read (DR-415). After an ad row:
            space-module above (LAY-12); space-section to Most read. */}
        {formats ? (
          <CategoryFormatsSection
            lang={lang}
            analysis={page.analysis}
            opinion={page.opinion}
            t={t}
            className={cn(
              page.feature && "pt-(--space-module)",
              "pb-(--space-section)",
            )}
          />
        ) : null}
        {/* Most read in this category: P-5 with RankedList columns (C-07: from 1024 the list
            in the end two thirds, 1 to 3 then 4 and 5, no rule between items), then its ad
            row. After an ad row: space-module above (LAY-12). */}
        {page.mostRead.length > 0 ? (
          <>
            <MostReadSection
              lang={lang}
              stories={page.mostRead}
              t={t}
              className={cn(
                page.feature && !formats && "pt-(--space-module)",
                "pb-(--space-module)",
              )}
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </>
        ) : null}
        {/* More stories: the older stories, 10 at a time. After an ad row: space-module
            above (LAY-12); main ends with space-section. */}
        {page.more.length > 0 ? (
          <CategoryMoreStoriesSection
            stories={page.more}
            t={t}
            className={cn(afterAd && "pt-(--space-module)")}
          />
        ) : null}
      </main>
      <Footer lang={lang} />
    </>
  );
}
