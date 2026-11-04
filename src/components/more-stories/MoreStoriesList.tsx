import { dividerItem, listInk } from "@/components/layout/Divider";
import type { EyebrowMode } from "@/components/story/Eyebrow";
import { StoryCard } from "@/components/story/StoryCard";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  stories: Story[];
  t: Pick<Dictionary, "story" | "categories" | "analysisOpinion">;
  /** The C-08 `category` Eyebrow on every row: the Latest page, which mixes categories. */
  eyebrow?: boolean;
  /** With `eyebrow` on: category on every row (Latest), or format (the topic page). */
  eyebrowMode?: EyebrowMode;
  /** h2 when no section heading sits between the page h1 and the titles (Latest). */
  titleAs?: "h2" | "h3";
  /** The index of the first row a load more press added: rows from it on fade in. */
  addedFrom?: number;
};

/**
 * MoreStoriesList: the More stories list of the category page and the Latest page (tajmin,
 * after checkpoint 5): one StoryCard per story in the dated layout (C-24: date | title and
 * deck | image from 600, the basic image card on phones; the date is the time only),
 * Divider.item between the rows. With `eyebrow` off (the category page), news rows show no
 * Eyebrow (DR-153) and an analysis row shows the format Eyebrow above the title at every
 * width (tajmin, 28 Oct 2026). With `eyebrow` on (the Latest page, which mixes categories),
 * every row shows the category Eyebrow (tajmin, 28 Oct 2026). With `eyebrowMode` "format" (the
 * topic page), a news row shows its category and an analysis row the format (tajmin, 30 Oct 2026).
 */
export function MoreStoriesList({
  stories,
  t,
  eyebrow = false,
  eyebrowMode,
  titleAs = "h3",
  addedFrom,
}: Props) {
  return (
    <ul className={listInk.mediaMeta}>
      {stories.map((story, index) => {
        const added = addedFrom !== undefined && index >= addedFrom;
        return (
          <li
            key={story.id}
            className={cn(dividerItem, added && "story-added")}
            data-added={added || undefined}
          >
            <StoryCard
              story={story}
              strings={t}
              variant="dated"
              eyebrow={eyebrow}
              eyebrowMode={eyebrowMode}
              formatLabel
              titleAs={titleAs}
              imageFadeIn={added}
            />
          </li>
        );
      })}
    </ul>
  );
}
