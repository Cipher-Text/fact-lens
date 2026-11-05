import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { PageTitle } from "@/components/layout/PageTitle";
import { MoreStoriesSection } from "@/components/more-stories/MoreStoriesSection";
import type { RegionPage } from "@/content";
import { getDictionary } from "@/i18n";

type Props = {
  page: RegionPage;
};

/**
 * The region page (layout 7C.2 Paths, Region row; DR-411): the news and analysis of one
 * region, newest first, no opinion. Page order as the topic page (layout 7E; tajmin, 5 Nov
 * 2026): header, ad-top, PageTitle, the list, footer. No ad band, no rail ad.
 */
export function RegionPageView({ page }: Props) {
  const { lang, region } = page;
  const t = getDictionary(lang);

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} path={`/regions/${region}`} />
      {/* The top ad row is below the header, full width (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={t.ads} />
      {/* tabIndex -1: the SkipLink target takes focus in every browser (DR-269). */}
      <main
        id="main"
        tabIndex={-1}
        className="pb-(--space-section) focus-visible:outline-none"
      >
        {/* The region name is the h1, with no label and no description, as the topic page
            (tajmin, 5 Nov 2026). */}
        <PageTitle
          id="region-title"
          title={t.regions[region]}
          className="mb-(--space-module)"
        />
        {/* The list of the Latest page, reused: the h1 names it; 10 first, then 10 per press.
            The Eyebrow: category on news, format on analysis (DR-417). With no news or
            analysis the section is not shown; the empty-state message is U-63. */}
        {page.stories.length > 0 ? (
          <MoreStoriesSection
            stories={page.stories}
            labelledBy="region-title"
            section="region"
            eyebrow
            eyebrowMode="format"
            t={t}
          />
        ) : null}
      </main>
      <Footer lang={lang} />
    </>
  );
}
