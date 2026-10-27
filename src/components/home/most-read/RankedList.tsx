import Link from "next/link";

import { headlineLink, storyHref } from "@/components/story/links";
import type { Lang, Story } from "@/content";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type RankedListProps = {
  lang: Lang;
  stories: Story[];
  className?: string;
};

// CSS columns, so an item does not take the height of the item beside it. The first column
// takes 3 items; the second starts with a forced column break and no space above it, so the
// tops of the two columns line up.
const COLUMN_ITEMS = 3;
const columnStart = "sm:mt-0 sm:break-before-column";

/**
 * C-07 RankedList: the most read stories as a numbered list (DR-44). One column on phones,
 * two from 600, column-first: items 1 to 3 in the first and the rest in the second. The
 * items are --rank-list-gap apart with no rule. The rank is a span with the rank from the
 * data (DR-290), digits in the page language, aria-hidden (the <ol> order gives the rank),
 * in a square chip centered on the whole title (rank-list in components.css).
 * RankedList.item is the title only: no image, no meta. Column gap is --grid-column-gap.
 */
export function RankedList({ lang, stories, className }: RankedListProps) {
  return (
    <ol
      className={cn(
        "rank-list sm:columns-2 sm:gap-x-(--grid-column-gap)",
        className,
      )}
    >
      {stories.map((story, index) => (
        <li
          key={story.id}
          data-most-read-item
          className={cn(
            "min-w-0 sm:break-inside-avoid",
            index > 0 && "mt-(--rank-list-gap)",
            index === COLUMN_ITEMS && columnStart,
          )}
        >
          {/* The chip trims the inner span to the ink of the digits (rank-list). */}
          <span aria-hidden="true">
            <span>{formatNumber(story.rank ?? index + 1, lang)}</span>
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
