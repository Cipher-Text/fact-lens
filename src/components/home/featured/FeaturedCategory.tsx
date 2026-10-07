import { Rail } from "@/components/layout/Rail";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import type { FeaturedSection } from "@/content";
import type { Dictionary } from "@/i18n";

import { FeaturedLead } from "./FeaturedLead";
import { FeaturedRail } from "./FeaturedRail";

type FeaturedCategoryProps = {
  section: FeaturedSection;
  t: Dictionary;
  className?: string;
};

/**
 * P-2 Featured category (spacing-layout-system.md 7.2 and 7.3, DR-49, DR-55). The same
 * wrapper + rail layout as the hero: the lead in the wrapper, one image story and two
 * stories in the 304px rail from 1024px; below 1024px the rail is under the wrapper
 * (LAY-05). Sparse (7.3): with no rail stories the wrapper spans the shell.
 * The section id is the anchor of the category links in the nav and drawer (IMP-14).
 */
export function FeaturedCategory({
  section,
  t,
  className,
}: FeaturedCategoryProps) {
  const { category, lead, rail } = section;
  const titleId = `category-${category}-title`;

  const wrapper = (
    <Wrapper data-featured-wrapper>
      <FeaturedLead story={lead} strings={t} />
    </Wrapper>
  );

  return (
    <Shell
      as="section"
      id={`category-${category}`}
      aria-labelledby={titleId}
      data-section="featured"
      data-category={category}
      className={className}
    >
      <SectionHeading id={titleId}>{t.categories[category]}</SectionHeading>
      {rail.length > 0 ? (
        <WithRail>
          {wrapper}
          <Rail data-featured-rail>
            <FeaturedRail stories={rail} strings={t} />
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
    </Shell>
  );
}
