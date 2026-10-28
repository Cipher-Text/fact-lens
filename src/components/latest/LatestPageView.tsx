import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { PageTitle } from "@/components/layout/PageTitle";
import { MoreStoriesSection } from "@/components/more-stories/MoreStoriesSection";
import type { LatestPage } from "@/content";
import { getDictionary } from "@/i18n";

type Props = {
  page: LatestPage;
};

/**
 * The Latest page (`docs/briefs/latest.md`): the news hub, news of every category, newest
 * first (layout 7C.2 Paths, News hub row: news only). Page order: header, ad-top, PageTitle, the list, footer. No ad band
 * (tajmin, 28 Oct 2026).
 */
export function LatestPageView({ page }: Props) {
  const { lang } = page;
  const t = getDictionary(lang);

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} path="/latest" />
      {/* The top ad row is below the header, full width (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={t.ads} />
      {/* tabIndex -1: the SkipLink target takes focus in every browser (DR-269). */}
      <main
        id="main"
        tabIndex={-1}
        className="pb-(--space-section) focus-visible:outline-none"
      >
        {/* The title band is the first row of main, under the ad-top row, as on the
            category page (C-43). The same সর্বশেষ / Latest label as the hero rail. */}
        <PageTitle
          id="latest-title"
          title={t.hero.latest}
          className="mb-(--space-module)"
        />
        {/* The list: the More stories section of the category page, reused (tajmin, 28 Oct
            2026). The h1 names it; 10 first, then 10 per press (tajmin, 28 Oct 2026); the category Eyebrow on
            every row. With no news the section is not shown (7.3). */}
        {page.stories.length > 0 ? (
          <MoreStoriesSection
            stories={page.stories}
            labelledBy="latest-title"
            eyebrow
            t={t}
          />
        ) : null}
      </main>
      <Footer lang={lang} />
    </>
  );
}
