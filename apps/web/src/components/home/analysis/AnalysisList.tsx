import { dividerItem, listInk } from "@/components/layout/Divider";
import { MoreLink } from "@/components/story/MoreLink";
import { OverlapCard } from "@/components/story/OverlapCard";
import { StoryCard } from "@/components/story/StoryCard";
import type { Lang, Story } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";

type AnalysisListProps = {
  lang: Lang;
  stories: Story[];
  strings: Pick<
    Dictionary,
    "analysisOpinion" | "story" | "categories" | "common"
  >;
};

/**
 * P-4 AnalysisSection, the analysis column (component-system.md P-4): the first story is an
 * OverlapCard on the section background (surface-elevated), then compact rows (StoryCard
 * row, 16:9, sm, text : image = 2 : 1, eyebrow, no summary). No chip and no heading on this
 * column. The stories sit in one list with Divider.item between them (DR-268); the rows start
 * with the image, so the item space is measured to the image top (DR-350). Titles are h3.
 */
export function AnalysisList({ lang, stories, strings }: AnalysisListProps) {
  const [feature, ...compact] = stories;
  return (
    <div data-column="analysis">
      <ul className={listInk.mediaMeta}>
        <li className={dividerItem}>
          <OverlapCard story={feature} strings={strings} surface="elevated" />
        </li>
        {compact.map((story) => (
          <li key={story.id} className={dividerItem}>
            <StoryCard
              story={story}
              strings={strings}
              layout="row"
              ratio="16:9"
              size="sm"
              split="third"
              summary={false}
            />
          </li>
        ))}
      </ul>
      <MoreLink
        href={localizedPath(lang, "/analysis")}
        section={strings.analysisOpinion.analysis}
        strings={strings.common}
      />
    </div>
  );
}
