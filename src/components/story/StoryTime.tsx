import type { Story } from "@/content";
import { formatStoryTime } from "@/lib/story-time";

/**
 * The time of a story in a MetaLine (TYP-17, DR-274). The exact time is in `datetime`. The
 * server writes the Dhaka date and time; the inline script in the layout writes the reader
 * text (relative for 24 hours) after load, so the text differs on purpose.
 */
export function StoryTime({
  story,
}: {
  story: Pick<Story, "publishedAt" | "lang">;
}) {
  return (
    <time data-story-time dateTime={story.publishedAt} suppressHydrationWarning>
      {formatStoryTime(story.publishedAt, story.lang)}
    </time>
  );
}
