import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { Divider } from "@/components/layout/Divider";
import { PageTitle } from "@/components/layout/PageTitle";
import { Shell } from "@/components/layout/Shell";
import { MoreStoriesSection } from "@/components/more-stories/MoreStoriesSection";
import type { AnalysisPage } from "@/content";
import { getDictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { AnalysisCoverSection } from "./AnalysisCoverSection";
import { AnalysisTopSection } from "./AnalysisTopSection";

type Props = {
  page: AnalysisPage;
};

/**
 * The analysis hub (layout 7C.2 Paths, Analysis hub row): analysis stories only, newest
 * first. Page order: header, ad-top, PageTitle with a description, the hero, the mosaic
 * with the ad rail, ad-band, More stories, footer (tajmin, 2 Nov 2026).
 */
export function AnalysisPageView({ page }: Props) {
  const { lang } = page;
  const t = getDictionary(lang);
  // The ad band and More stories show only with list stories (7.3, LAY-13). The ad band
  // follows the mosaic; with no mosaic it follows the hero.
  const more = page.more.length > 0;

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} path="/analysis" />
      {/* The top ad row is below the header, full width (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={t.ads} />
      {/* tabIndex -1: the SkipLink target takes focus in every browser (DR-269). */}
      <main
        id="main"
        tabIndex={-1}
        className="pb-(--space-section) focus-visible:outline-none"
      >
        {/* The title band is the first row of main, under the ad-top row, as on the
            category page (C-43), with a short description below the title (tajmin, 2 Nov
            2026). */}
        <PageTitle
          id="analysis-title"
          title={t.analysisOpinion.analysis}
          description={t.analysisPage.description}
          className="mb-(--space-module)"
        />
        {/* The hero: the newest analysis story, across the shell, no rail. space-module
            before the rule, or before the ad band (LAY-12); as the last row it adds
            none: main ends with space-section. */}
        {page.cover ? (
          <AnalysisCoverSection
            story={page.cover}
            t={t}
            className={cn(
              (page.top.length > 0 || more) && "pb-(--space-module)",
            )}
          />
        ) : null}
        {/* Divider.rule (1px solid) between the hero and the mosaic, space-module on each
            side (tajmin, 4 Nov 2026). Before the ad band there is no rule. */}
        {page.cover && page.top.length > 0 ? (
          <Shell data-analysis-cover-rule>
            <Divider variant="rule" />
          </Shell>
        ) : null}
        {/* The mosaic: the next 4, 2 x 2, with the ad rail from 1024. The ad band comes
            after it, so the space before the ad row belongs to it (LAY-12). */}
        {page.top.length > 0 ? (
          <AnalysisTopSection
            lang={lang}
            stories={page.top}
            t={t}
            className={cn(
              page.cover && "pt-(--space-module)",
              more && "pb-(--space-module)",
            )}
          />
        ) : null}
        {/* More stories as on the category page: the rest, 10 then 10, its SectionHeading;
            the category Eyebrow on every row (C-08, DR-417). After the ad row: space-module
            above (LAY-12). */}
        {more ? (
          <>
            <AdSlot variant="band" lang={lang} strings={t.ads} />
            <MoreStoriesSection
              stories={page.more}
              eyebrow
              t={t}
              className="pt-(--space-module)"
            />
          </>
        ) : null}
      </main>
      <Footer lang={lang} />
    </>
  );
}
