import type { CSSProperties } from "react";

import { dividerItem } from "@/components/layout/Divider";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { StoryListItem } from "./StoryListItem";

type StoryListProps = {
  stories: Story[];
  strings: Pick<Dictionary, "story" | "categories">;
  /**
   * 1: one column. 2: two columns from 768 to 1023px, column-first, with a 24px gap and rules
   * inside a column only (DR-125); one column elsewhere. 2 is the Latest list under the hero.
   */
  columns?: 1 | 2;
  meta?: "category-time" | "time-reading";
  titleAs?: "h3" | "h4";
  className?: string;
};

// A column start has no rule above it, so the list rules stay inside a column.
const columnStart = "md:max-lg:mt-0 md:max-lg:border-t-0 md:max-lg:pt-0";

/**
 * C-03 StoryList: a ul of StoryListItem rows, 16px padding and a 1px rule between rows, no
 * rule after the last row. Two columns fill column-first (1 to 3, then 4 and 5 for five
 * stories) with a grid that flows by column.
 */
export function StoryList({
  stories,
  strings,
  columns = 1,
  meta,
  titleAs,
  className,
}: StoryListProps) {
  const rows = Math.ceil(stories.length / 2);
  return (
    <ul
      data-story-list
      data-columns={columns}
      style={{ "--story-list-rows": `repeat(${rows}, auto)` } as CSSProperties}
      className={cn(
        columns === 2 &&
          "md:max-lg:grid md:max-lg:auto-cols-fr md:max-lg:grid-flow-col md:max-lg:grid-rows-(--story-list-rows) md:max-lg:gap-x-(--grid-column-gap)",
        className,
      )}
    >
      {stories.map((story, index) => (
        <li
          key={story.id}
          className={cn(
            dividerItem,
            columns === 2 && index % rows === 0 && columnStart,
          )}
        >
          <StoryListItem
            story={story}
            strings={strings}
            meta={meta}
            titleAs={titleAs}
          />
        </li>
      ))}
    </ul>
  );
}
