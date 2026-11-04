import { Rail } from "@/components/layout/Rail";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { OverlapCard } from "@/components/story/OverlapCard";
import { StoryList } from "@/components/story/StoryList";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

type Props = {
  cover: Story;
  latest: Story[];
  t: Dictionary;
  className?: string;
};

/**
 * RegionsCoverSection: the top of the region hub (page/regions brief), laid out as
 * CategoryCoverSection without the card rows. Wrapper: the cover story as OverlapCard
 * (C-02) with the option large (N-06, DR-451). The page mixes categories, so the cover shows
 * the Eyebrow (DR-153 does not apply) in `format` mode (C-08, DR-417): news the category,
 * analysis বিশ্লেষণ / Analysis (tajmin, 5 Nov 2026: "use only format"). Rail: SectionHeading
 * সর্বশেষ / Latest and StoryList (C-03), the 5 newest stories with a region, category and
 * time, 2 columns at 768 to 1023 as on the category page. No MoreLink (tajmin, 4 Nov 2026).
 * From 1024 the rail is beside the wrapper; below, it goes under the wrapper (LAY-05). With
 * no Latest stories the wrapper spans the shell (spacing-layout-system.md 7.3).
 */
export function RegionsCoverSection({ cover, latest, t, className }: Props) {
  const wrapper = (
    <Wrapper data-regions-cover-wrapper>
      <OverlapCard story={cover} strings={t} eager eyebrowMode="format" large />
    </Wrapper>
  );

  return (
    <Shell
      as="section"
      aria-labelledby="regions-cover-title"
      data-section="regions-cover"
      className={className}
    >
      <h2 id="regions-cover-title" className="sr-only">
        {t.regionsPage.cover}
      </h2>
      {latest.length > 0 ? (
        <WithRail>
          {wrapper}
          <Rail data-regions-rail>
            <section aria-labelledby="regions-latest-title" data-latest>
              <SectionHeading as="h2" id="regions-latest-title">
                {t.regionsPage.latest}
              </SectionHeading>
              <StoryList
                stories={latest}
                strings={t}
                columns={2}
                meta="category-time"
              />
            </section>
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
    </Shell>
  );
}
