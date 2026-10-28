import { dividerItem, listInk } from "@/components/layout/Divider";
import { StoryCard } from "@/components/story/StoryCard";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

type ListProps = {
  stories: Story[];
  t: Pick<Dictionary, "story" | "categories" | "analysisOpinion">;
};

/**
 * The card row list: one StoryCard row per story, text at the start and the 16:9 image at
 * the end, text : image = 2 : 1 (C-24 row, split third), with the summary. Divider.item
 * between the rows, as in AnalysisList (DR-268); the rows start with the image top, so the
 * item space is measured to it (DR-350). No Eyebrow: the page title names the category
 * (DR-153). The card rows (spacing-layout-system.md 7B) sit under the feature story in
 * the CategoryFeatureSection wrapper, as the top stories do in HeroSection; More stories used the same list
 * (tajmin's tweak at checkpoint 5).
 */
export function CategoryCardList({ stories, t }: ListProps) {
  return (
    <ul className={listInk.mediaMeta}>
      {stories.map((story) => (
        <li key={story.id} className={dividerItem}>
          <StoryCard
            story={story}
            strings={t}
            layout="row"
            ratio="16:9"
            size="md"
            split="third"
            eyebrow={false}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * CategoryMoreStoriesList: the More stories list (tajmin, after checkpoint 5): one StoryCard
 * per story in the dated layout (C-24: date | title and deck | image from 600, the basic
 * image card on phones; the date is the time only), Divider.item between the rows. News
 * rows show no Eyebrow (DR-153). An analysis row shows the format Eyebrow above the title
 * at every width (tajmin, 28 Oct 2026).
 */
export function CategoryMoreStoriesList({ stories, t }: ListProps) {
  return (
    <ul className={listInk.mediaMeta}>
      {stories.map((story) => (
        <li key={story.id} className={dividerItem}>
          <StoryCard
            story={story}
            strings={t}
            layout="dated"
            ratio="16:9"
            size="md"
            eyebrow={false}
            formatLabel
          />
        </li>
      ))}
    </ul>
  );
}
