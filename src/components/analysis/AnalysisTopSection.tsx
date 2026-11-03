import { AdSlot } from "@/components/ads/AdSlot";
import { dividerColumn } from "@/components/layout/Divider";
import { PeerRow } from "@/components/layout/PeerRow";
import { Rail } from "@/components/layout/Rail";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { OverlapCard } from "@/components/story/OverlapCard";
import type { Lang, Story } from "@/content";
import type { Dictionary } from "@/i18n";

type Props = {
  lang: Lang;
  stories: Story[];
  t: Dictionary;
  className?: string;
};

/**
 * The mosaic of the analysis hub: up to 4 stories after the hero, a 2 x 2 grid as the
 * homepage grouped categories (tajmin, 2 Nov 2026). The cards are the homepage hero top
 * story cards, OverlapCard (C-02): Eyebrow, title, deck, meta. The Eyebrow is the category
 * (C-08, DR-417). 1 card per row below 600px, 2 from 600px (LAY-07); each card flows on its
 * own (DR-99). No rules within the grid; the rows are --space-analysis-top-row-gap apart (the
 * row gap, 32px from 1280; tajmin, 4 Nov 2026). A hidden h2 names the section.
 * Rail: the ad-rail slot from 1024, whenever the rail is beside the wrapper (tajmin, 4 Nov
 * 2026; the homepage P-3 rail ad stays from 1280, DR-245). Below 1024 the Rail is not drawn,
 * so it adds no row. From 1024 a 1px full-height column rule
 * (Divider.column-full) sits in the middle of the gap between the wrapper and the rail
 * (tajmin, 4 Nov 2026).
 */
export function AnalysisTopSection({ lang, stories, t, className }: Props) {
  return (
    <Shell
      as="section"
      aria-labelledby="analysis-top-title"
      data-section="analysis-top"
      className={className}
    >
      <h2 id="analysis-top-title" className="sr-only">
        {t.analysisPage.top}
      </h2>
      <WithRail className={dividerColumn.railFull}>
        <Wrapper data-analysis-top-wrapper>
          <PeerRow
            data-analysis-top
            className="items-start gap-y-(--space-analysis-top-row-gap)"
          >
            {stories.map((story) => (
              <OverlapCard
                key={story.id}
                story={story}
                strings={t}
                eyebrowMode="category"
              />
            ))}
          </PeerRow>
        </Wrapper>
        <Rail data-analysis-top-rail className="max-lg:hidden">
          <AdSlot variant="rail" railFrom="lg" lang={lang} strings={t.ads} />
        </Rail>
      </WithRail>
    </Shell>
  );
}
