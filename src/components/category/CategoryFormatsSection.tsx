import { OpinionRows } from "@/components/home/analysis/OpinionList";
import { CategoryBlock } from "@/components/home/grouped/CategoryBlock";
import { groupedRow } from "@/components/home/grouped/GroupedCategoriesSection";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { formatHref } from "@/components/story/links";
import type { Lang, Story } from "@/content";
import type { Dictionary } from "@/i18n";

type Props = {
  lang: Lang;
  analysis: Story[];
  opinion: Story[];
  t: Dictionary;
  className?: string;
};

/**
 * The analysis and opinion row of the category page (DR-415, layout 7B.1),
 * directly above Most read. The P-3 layout: one row of two CategoryBlocks (C-23), Analysis
 * at the start and Opinion at the end, 1 per row on phones (LAY-07). Up to 5 stories per
 * block. Analysis keeps the C-23 feature card and StoryList; Opinion uses the OpinionList
 * quote rows of P-4 (no image, author line). The blocks stay in the wrapper column and the
 * rail column is empty, as in MoreStoriesSection, so they have the P-3 widths. The halves
 * are fixed: Analysis always at the start, Opinion always at the end. An empty block is not
 * shown and leaves its half empty; the other keeps its size and place (DR-436, layout 7B.1,
 * 7B.3). On phones, one block per row, the empty half takes no row. With both empty the row
 * is removed. No Eyebrow (DR-153). The MoreLinks go to the format hubs.
 */
export function CategoryFormatsSection({
  lang,
  analysis,
  opinion,
  t,
  className,
}: Props) {
  const blocks = [
    { format: "analysis" as const, stories: analysis },
    { format: "opinion" as const, stories: opinion },
  ];
  if (blocks.every((block) => block.stories.length === 0)) return null;
  return (
    <Shell as="div" data-section="category-formats" className={className}>
      <WithRail>
        <Wrapper>
          <div data-grouped-row className={groupedRow}>
            {blocks.map(({ format, stories }) =>
              stories.length === 0 ? (
                // sm:block matches the sm:grid-cols-2 of groupedRow: below 600 the row is
                // one column, so the empty half must take no row. Change them together.
                <div
                  key={format}
                  data-empty-half={format}
                  className="hidden sm:block"
                />
              ) : (
                <CategoryBlock
                  key={format}
                  name={format}
                  heading={t.analysisOpinion[format]}
                  href={formatHref(lang, format)}
                  stories={stories}
                  t={t}
                >
                  {format === "opinion" ? (
                    <OpinionRows stories={stories} />
                  ) : undefined}
                </CategoryBlock>
              ),
            )}
          </div>
        </Wrapper>
      </WithRail>
    </Shell>
  );
}
