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
import { CategoryMoreStoriesSection } from "./CategoryMoreStoriesSection";

type Props = {
  page: CategoryPage;
};

/** One template for every category page. Page order: docs/briefs/category.md. */
export function CategoryPageView({ page }: Props) {
  const { lang, category } = page;
  const t = getDictionary(lang);
  const afterAd = page.feature !== null || page.mostRead.length > 0;

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
        className="pt-(--space-page-start) pb-(--space-section) focus-visible:outline-none"
      >
        <PageTitle
          title={t.categories[category]}
          className="pb-(--space-section-title-after)"
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
        {/* Most read in this category: P-5 in the columns layout (title | 1 to 3 | 4 and 5
            from 1024), Divider.item inside a column, then its ad row. After an ad row:
            space-module above (LAY-12). */}
        {page.mostRead.length > 0 ? (
          <>
            <MostReadSection
              lang={lang}
              stories={page.mostRead}
              t={t}
              layout="columns"
              className={cn(
                page.feature && "pt-(--space-module)",
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
