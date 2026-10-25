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
  lead: Story;
  latest: Story[];
  t: Dictionary;
  className?: string;
};

/**
 * The category page lead block (docs/briefs/category.md, section 3): the top story as an
 * OverlapCard (C-02, tajmin's tweak at checkpoint 2) in the wrapper, and the category's latest stories in the rail, as HeroSection lays them out
 * (LAY-05). No Eyebrow: the page title names the category (DR-153). With no latest
 * stories the wrapper spans the shell (spacing-layout-system.md 7.3).
 */
export function CategoryLead({ lead, latest, t, className }: Props) {
  const wrapper = (
    <Wrapper data-category-wrapper>
      <OverlapCard story={lead} strings={t} eager eyebrow={false} />
    </Wrapper>
  );

  return (
    <Shell
      as="section"
      aria-labelledby="category-lead-title"
      data-section="category-lead"
      className={className}
    >
      <h2 id="category-lead-title" className="sr-only">
        {t.categoryPage.lead}
      </h2>
      {latest.length > 0 ? (
        <WithRail>
          {wrapper}
          <Rail data-category-rail>
            {/* The rail list shows time and reading time, not the category (DR-153, C-25). */}
            <section aria-labelledby="category-latest-title" data-latest>
              <SectionHeading as="h2" id="category-latest-title">
                {t.categoryPage.latest}
              </SectionHeading>
              <StoryList stories={latest} strings={t} columns={2} />
            </section>
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
    </Shell>
  );
}
