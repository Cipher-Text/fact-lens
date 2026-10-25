import Link from "next/link";

import { dividerItemGrid, listInk } from "@/components/layout/Divider";
import { headlineLink, storyHref } from "@/components/story/links";
import type { Lang, Story } from "@/content";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type RankedListProps = {
  lang: Lang;
  stories: Story[];
  /**
   * false: no Divider.item between the rows; the rows are --grid-row-gap apart instead
   * (category page, tajmin's tweak at checkpoint 4). The homepage keeps the rules.
   */
  rules?: boolean;
  className?: string;
};

/**
 * C-07 RankedList: the most read stories as a numbered list (DR-44, DR-51, DR-145). 1 per
 * row on phones, 2 from 600, 3 from 1024 (items 4 and 5 on row 2), 4 from 1280 (item 5 on
 * row 2). The numeral is a span with the rank from the
 * data (DR-290), digits in the page language, styled by .rank-list (typography-system.md 7.1,
 * type-rank): text-interactive, aria-hidden; the <ol> order gives the rank. RankedList.item is the title only: no image,
 * no meta. Column gap is --grid-column-gap. Divider.item between two items in the same column, none across
 * columns (DR-299, DR-300), so the list has no row gap: the rule has space-list-item on each side.
 */
export function RankedList({
  lang,
  stories,
  rules = true,
  className,
}: RankedListProps) {
  return (
    <ol
      className={cn(
        listInk.title,
        "rank-list grid grid-cols-1 gap-x-(--grid-column-gap) sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        rules ? "gap-y-0" : "gap-y-(--grid-row-gap)",
        className,
      )}
    >
      {stories.map((story, index) => (
        <li
          key={story.id}
          data-most-read-item
          className={cn("min-w-0", rules && dividerItemGrid)}
        >
          <span aria-hidden="true">
            {formatNumber(story.rank ?? index + 1, lang)}
          </span>
          <h3 className="type-story-title-sm">
            <Link href={storyHref(story)} className={headlineLink}>
              {story.title}
            </Link>
          </h3>
        </li>
      ))}
    </ol>
  );
}
