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
   * grid: the homepage rows (DR-51, DR-145). columns: two columns from 600, column-first,
   * items 1 to 3 in the first and the rest in the second, the items --rank-list-gap apart
   * with no rule, and the rank in a chip (category page, tajmin's redesign after checkpoint
   * 5). One column on phones in both.
   */
  layout?: "grid" | "columns";
  className?: string;
};

// The columns layout: CSS columns, so an item does not take the height of the item beside
// it. The first column takes 3 items; the second starts with a forced column break and no
// space above it, so the tops of the two columns line up.
const COLUMN_ITEMS = 3;
const columnStart = "sm:mt-0 sm:break-before-column";

/**
 * C-07 RankedList: the most read stories as a numbered list (DR-44, DR-51, DR-145). The
 * grid layout has 1 per row on phones, 2 from 600, 3 from 1024 (items 4 and 5 on row 2), 4
 * from 1280 (item 5 on row 2). The numeral is a span with the rank from the
 * data (DR-290), digits in the page language, styled by .rank-list (typography-system.md 7.1,
 * type-rank): text-interactive, aria-hidden; the <ol> order gives the rank. RankedList.item is the title only: no image,
 * no meta. Column gap is --grid-column-gap. Divider.item between two items in the same column, none across
 * columns (DR-299, DR-300), so the list has no row gap: the rule has space-list-item on each side.
 * The columns layout has no rule and puts the rank in a square chip, centered on the whole
 * title (rank-list-chip in components.css; category page, tajmin).
 */
export function RankedList({
  lang,
  stories,
  layout = "grid",
  className,
}: RankedListProps) {
  const columns = layout === "columns";
  return (
    <ol
      data-layout={layout}
      className={cn(
        "rank-list",
        columns
          ? "rank-list-chip sm:columns-2 sm:gap-x-(--grid-column-gap)"
          : [
              listInk.title,
              "grid grid-cols-1 gap-x-(--grid-column-gap) gap-y-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            ],
        className,
      )}
    >
      {stories.map((story, index) => {
        const rank = formatNumber(story.rank ?? index + 1, lang);
        return (
          <li
            key={story.id}
            data-most-read-item
            className={cn(
              "min-w-0",
              columns
                ? [
                    "sm:break-inside-avoid",
                    index > 0 && "mt-(--rank-list-gap)",
                    index === COLUMN_ITEMS && columnStart,
                  ]
                : dividerItemGrid,
            )}
          >
            {/* The chip trims the inner span to the ink of the digits (rank-list-chip). */}
            <span aria-hidden="true">
              {columns ? <span>{rank}</span> : rank}
            </span>
            <h3 className="type-story-title-sm">
              <Link href={storyHref(story)} className={headlineLink}>
                {story.title}
              </Link>
            </h3>
          </li>
        );
      })}
    </ol>
  );
}
