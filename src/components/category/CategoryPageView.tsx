import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { MostReadSection } from "@/components/home/most-read/MostReadSection";
import type { CategoryPage } from "@/content";
import { getDictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { CategoryCards } from "./CategoryCards";
import { CategoryHeader } from "./CategoryHeader";
import { CategoryLead } from "./CategoryLead";
import { CategoryMoreNews } from "./CategoryMoreNews";

type Props = {
  page: CategoryPage;
};

/** One template for every category page. Page order: docs/briefs/category.md. */
export function CategoryPageView({ page }: Props) {
  const { lang, category } = page;
  const t = getDictionary(lang);
  const afterAd = page.cards.length > 0 || page.mostRead.length > 0;

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
        <CategoryHeader
          title={t.categories[category]}
          className="pb-(--space-section-title-after)"
        />
        {page.lead ? (
          <CategoryLead
            lead={page.lead}
            latest={page.latest}
            t={t}
            className="pb-(--space-section)"
          />
        ) : null}
        {/* A section with no stories also hides its ad row (7.3, LAY-13). The space
            before the ad row belongs to the section (LAY-12). */}
        {page.cards.length > 0 ? (
          <>
            <CategoryCards
              lang={lang}
              stories={page.cards}
              t={t}
              className="pb-(--space-module)"
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </>
        ) : null}
        {/* Most read in this category: P-5 as on the homepage, the top 5 ranked stories,
            no rule between the rows, then its ad row. After an ad row: space-module
            above (LAY-12). */}
        {page.mostRead.length > 0 ? (
          <>
            <MostReadSection
              lang={lang}
              stories={page.mostRead}
              t={t}
              rules={false}
              className={cn(
                page.cards.length > 0 && "pt-(--space-module)",
                "pb-(--space-module)",
              )}
            />
            <AdSlot variant="band" lang={lang} strings={t.ads} />
          </>
        ) : null}
        {/* More news: the older stories, 10 at a time. After an ad row: space-module
            above (LAY-12); main ends with space-section. */}
        {page.more.length > 0 ? (
          <CategoryMoreNews
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
