import {
  dividerColumn,
  dividerItem,
  listInk,
} from "@/components/layout/Divider";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import type { EyebrowMode } from "./Eyebrow";
import { StoryListItem } from "./StoryListItem";

type StoryListProps = {
  stories: Story[];
  strings: Pick<Dictionary, "story" | "categories" | "analysisOpinion">;
  /**
   * 1: one column. 2: two columns from 768 to 1023px, column-first, with a 24px gap and rules
   * inside a column only (DR-125); one column elsewhere. 2 is the Latest list under the hero.
   * The two columns are CSS columns, not grid rows, so an item in one column does not take
   * the height of the item beside it: the rule space stays 16px to the ink (DR-350).
   * Divider.column-inset sits between the two columns, in the middle of the gap (DR-355).
   */
  columns?: 1 | 2;
  meta?: "category-time" | "time-reading";
  /** The C-08 Eyebrow on every row, in this mode; none when unset (C-25). The region hub
   * blocks use `two-part` (tajmin, 5 Nov 2026). */
  eyebrowMode?: EyebrowMode;
  titleAs?: "h3" | "h4";
  className?: string;
};

// A column start has no rule above it, so the list rules stay inside a column. The second
// column starts with a forced column break.
const columnStart = "md:max-lg:mt-0 md:max-lg:pt-0 md:max-lg:before:hidden";
const columnBreak = "md:max-lg:break-before-column";

/**
 * C-03 StoryList: a ul of StoryListItem rows, Divider.item (dotted, 16px each side) between rows, no
 * rule after the last row. Two columns fill column-first (1 to 3, then 4 and 5 for five
 * stories): CSS columns with a column break before the first item of the second column.
 */
export function StoryList({
  stories,
  strings,
  columns = 1,
  meta,
  eyebrowMode,
  titleAs,
  className,
}: StoryListProps) {
  const rows = Math.ceil(stories.length / 2);
  return (
    <ul
      data-story-list
      data-columns={columns}
      className={cn(
        listInk.titleMeta,
        columns === 2 && [
          "md:max-lg:columns-2 md:max-lg:gap-x-(--grid-column-gap)",
          dividerColumn.columns,
        ],
        className,
      )}
    >
      {stories.map((story, index) => (
        <li
          key={story.id}
          className={cn(
            dividerItem,
            columns === 2 && "md:max-lg:break-inside-avoid",
            columns === 2 && index % rows === 0 && columnStart,
            columns === 2 && index > 0 && index % rows === 0 && columnBreak,
          )}
        >
          <StoryListItem
            story={story}
            strings={strings}
            meta={meta}
            eyebrowMode={eyebrowMode}
            titleAs={titleAs}
          />
        </li>
      ))}
    </ul>
  );
}
