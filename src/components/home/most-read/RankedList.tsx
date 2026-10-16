import Link from "next/link";

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
 * no meta. Column gap 24px; row gap 20px on phones, 24px from 600.
 */
export function RankedList({ stories, className }: RankedListProps) {
  return (
    <ol
      className={cn(
        "rank-list grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {stories.map((story) => (
        <li key={story.id} data-most-read-item className="min-w-0">
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
