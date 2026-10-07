import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { fill, formatNumber, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type StoryMetaProps = {
  story: Story;
  strings: Dictionary["story"];
  /** Show the reading time after the time. Off in compact lists. */
  readingTime?: boolean;
  className?: string;
};

/**
 * Card metadata: time, then reading time (typography-system.md 7.1). The separator is
 * drawn with CSS, not a character. Time and digits in the page language, tabular digits (TYP-17).
 */
export function StoryMeta({
  story,
  strings,
  readingTime = true,
  className,
}: StoryMetaProps) {
  const minutes = readingTime ? story.readingMinutes : undefined;
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 type-metadata text-ink-muted tabular-nums",
        className,
      )}
    >
      <time dateTime={story.publishedAt}>
        {formatTime(new Date(story.publishedAt), story.lang)}
      </time>
      {minutes ? (
        <span
          data-reading-time
          className="flex items-center gap-x-2 before:size-1 before:rounded-full before:bg-current"
        >
          {fill(strings.readingTime, {
            minutes: formatNumber(minutes, story.lang),
          })}
        </span>
      ) : null}
    </p>
  );
}
