import Link from "next/link";

import { dividerItemGrid } from "@/components/layout/Divider";
import { headlineLink, storyHref } from "@/components/story/links";
import type { Story } from "@/content";
import { cn } from "@/lib/utils";

type RankedListProps = {
  stories: Story[];
  className?: string;
};

/**
 * C-07 RankedList: the most read stories as a numbered list (DR-44, DR-51, DR-145). 1 per
 * row on phones, 2 from 600, 3 from 1024 (items 4 and 5 on row 2), 4 from 1280 (item 5 on
 * row 2). The numeral is the .rank-list CSS counter (typography-system.md 7.1, type-rank):
 * Bengali digits on Bangla pages, decimal on English pages, text-interactive, hidden from
 * screen readers; the <ol> order gives the rank. RankedList.item is the title only: no image,
 * no meta. Column gap is --grid-column-gap. Divider.item between two items in the same column, none across
 * columns (DR-299, DR-300), so the list has no row gap: the rule has space-list-item on each side.
 */
export function RankedList({ stories, className }: RankedListProps) {
  return (
    <ol
      className={cn(
        "rank-list grid grid-cols-1 gap-x-(--grid-column-gap) gap-y-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {stories.map((story) => (
        <li
          key={story.id}
          data-most-read-item
          className={cn("min-w-0", dividerItemGrid)}
        >
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
