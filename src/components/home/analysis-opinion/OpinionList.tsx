import { Quote } from "lucide-react";
import Link from "next/link";

import { headlineLinkElevated, storyHref } from "@/components/story/links";
import { MoreLink } from "@/components/story/MoreLink";
import type { Lang, Story } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";
import { formatTime } from "@/lib/format";

import { listItem } from "./classes";

type OpinionListProps = {
  lang: Lang;
  stories: Story[];
  strings: Pick<Dictionary, "analysisOpinion" | "common">;
};

/**
 * The opinion column of P-4: a quote list (spacing-layout-system.md 7.2). Only this column
 * has the label chip: plain, not a link, type-eyebrow on accent-subtle in ink (DR-77,
 * typography-system.md 7.1). The chip is the column heading. Each item has a decorative
 * quote icon (aria-hidden), the title, then the author in 600 and the time.
 * Chip padding, chip-to-list space and the icon size and color are not in the specs
 * (UNRESOLVED_DESIGN_SYSTEM U-16).
 */
export function OpinionList({ lang, stories, strings }: OpinionListProps) {
  return (
    <section aria-labelledby="opinion-title" data-column="opinion">
      <h3
        id="opinion-title"
        className="mb-(--space-list-item) type-eyebrow text-ink"
      >
        <span data-chip className="inline-block bg-accent-subtle px-1">
          {strings.analysisOpinion.opinion}
        </span>
      </h3>
      <ul>
        {stories.map((story) => (
          <li key={story.id} className={listItem}>
            <article className="flex items-start gap-x-(--space-story-media-text)">
              <Quote
                aria-hidden="true"
                data-quote-icon
                className="size-6 shrink-0 text-ink-muted"
              />
              <div className="min-w-0 flex-1">
                <h4 className="type-story-title-sm">
                  <Link
                    href={storyHref(story)}
                    className={headlineLinkElevated}
                  >
                    {story.title}
                  </Link>
                </h4>
                {/* Author, then time. The separator is drawn with CSS (typography 7.1). */}
                <p className="mt-(--space-story-title-meta) flex flex-wrap items-center gap-x-2 type-metadata text-ink-muted tabular-nums">
                  {story.author ? (
                    <span className="font-semibold">{story.author.name}</span>
                  ) : null}
                  <time
                    dateTime={story.publishedAt}
                    className={
                      story.author
                        ? "flex items-center gap-x-2 before:size-1 before:rounded-full before:bg-current"
                        : undefined
                    }
                  >
                    {formatTime(new Date(story.publishedAt), story.lang)}
                  </time>
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <MoreLink
        href={localizedPath(lang, "/opinion")}
        section={strings.analysisOpinion.opinion}
        strings={strings.common}
        elevated
      />
    </section>
  );
}
