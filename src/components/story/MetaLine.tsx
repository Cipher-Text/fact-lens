import { Fragment, type ReactNode } from "react";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { fill, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { StoryTime } from "./StoryTime";

type MetaLineProps = {
  /** 1 to 3 items, set by the parent: plain text, no links. */
  items: ReactNode[];
  className?: string;
};

/**
 * C-09 MetaLine: type-metadata at weight 400 in --color-meta, one size per language
 * (CPT-12). Items are joined by a drawn separator: a 4px square, no radius, 10px each
 * side, centered, aria-hidden (CPT-10). The line wraps between items.
 */
export function MetaLine({ items, className }: MetaLineProps) {
  return (
    <p
      data-meta-line
      className={cn(
        "flex flex-wrap items-center type-metadata text-(--color-meta) tabular-nums",
        className,
      )}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span
              aria-hidden="true"
              data-meta-separator
              className="mx-2.5 size-1 shrink-0 bg-(--color-meta)"
            />
          ) : null}
          {item}
        </Fragment>
      ))}
    </p>
  );
}

/**
 * The items of a story's MetaLine: time, then reading time (DR-272). A story with no
 * readingMinutes shows the time only. Time and digits in the story language (TYP-17). Off for
 * the reading time in compact lists.
 */
export function storyMetaItems(
  story: Story,
  strings: Dictionary["story"],
  { readingTime = true }: { readingTime?: boolean } = {},
): ReactNode[] {
  const items: ReactNode[] = [<StoryTime key="time" story={story} />];
  if (readingTime && story.readingMinutes) {
    items.push(
      <span key="reading" data-reading-time>
        {fill(strings.readingTime, {
          minutes: formatNumber(story.readingMinutes, story.lang),
        })}
      </span>,
    );
  }
  return items;
}
