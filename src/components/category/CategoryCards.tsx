import { AdSlot } from "@/components/ads/AdSlot";
import { dividerItem, listInk } from "@/components/layout/Divider";
import { Rail } from "@/components/layout/Rail";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { StoryCard } from "@/components/story/StoryCard";
import type { Lang, Story } from "@/content";
import type { Dictionary } from "@/i18n";

type ListProps = {
  stories: Story[];
  t: Pick<Dictionary, "story" | "categories">;
};

/**
 * The card row list: one StoryCard row per story, Divider.item between the rows. The card
 * rows and More news use it (tajmin's tweak at checkpoint 5).
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

type Props = {
  lang: Lang;
  stories: Story[];
  t: Dictionary;
  className?: string;
};

/**
 * The category page card rows (docs/briefs/category.md, section 4): one StoryCard per row in
 * the wrapper, text at the start and the 16:9 image at the end, text : image = 2 : 1
 * (C-24 row, split third), with the summary. One list with Divider.item between the rows, as
 * in AnalysisList (DR-268); the rows start with the image top, so the item space is measured
 * to it (DR-350). No Eyebrow: the page title names the category (DR-153). No heading.
 * The rail holds one ad-rail slot (tajmin's tweak at checkpoint 3), shown from 1280 only
 * (DR-245); at 1024 to 1279 the rail column stays empty (tajmin, checkpoint 3).
 */
export function CategoryCards({ lang, stories, t, className }: Props) {
  return (
    <Shell data-section="category-cards" className={className}>
      <WithRail>
        <Wrapper data-category-cards-wrapper>
          <CategoryCardList stories={stories} t={t} />
        </Wrapper>
        {/* Hidden with its ad under 1280, so an empty rail adds no row gap under the cards. */}
        <Rail data-category-cards-rail className="hidden xl:block">
          <AdSlot variant="rail" lang={lang} strings={t.ads} />
        </Rail>
      </WithRail>
    </Shell>
  );
}
