import Link from "next/link";

import { Chip } from "@/components/story/Chip";
import { headlineLink, storyHref } from "@/components/story/links";
import { MoreLink } from "@/components/story/MoreLink";
import type { Lang, Story } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";
import { formatTime } from "@/lib/format";

import { QuoteMark } from "@/components/story/QuoteMark";

type OpinionListProps = {
  lang: Lang;
  stories: Story[];
  strings: Pick<Dictionary, "analysisOpinion" | "common">;
};

/**
 * C-06 OpinionList, the opinion column of P-4: the মতামত chip (a label, not a link), then
 * the opinion pieces as quote rows. Each row is a quote mark, then the title (h3, one link),
 * the author on its own line (600, ink-secondary, plain text) and the time on its own line
 * (400, ink-muted). No image and no rule; 24px between rows. The gap after the quote mark is
 * 12 / 16 / 20px at phone / 600 / 1024 (LAY-21). The chip-to-list space is not in the sheet
 * (UNRESOLVED_DESIGN_SYSTEM U-16).
 */
export function OpinionList({ lang, stories, strings }: OpinionListProps) {
  return (
    <div data-column="opinion">
      <p className="mb-(--space-list-item)">
        <Chip variant="label">{strings.analysisOpinion.opinion}</Chip>
      </p>
      <ul className="flex flex-col gap-y-6">
        {stories.map((story) => (
          <li key={story.id}>
            <article className="flex items-start gap-x-3 sm:gap-x-4 lg:gap-x-5">
              <QuoteMark />
              <div className="min-w-0 flex-1">
                <h3 className="type-story-title-sm">
                  <Link href={storyHref(story)} className={headlineLink}>
                    {story.title}
                  </Link>
                </h3>
                {story.author ? (
                  <p
                    data-author
                    className="mt-(--space-story-title-meta) type-metadata font-semibold text-ink-secondary"
                  >
                    {story.author.name}
                  </p>
                ) : null}
                <p data-time className="type-metadata text-ink-muted">
                  <time dateTime={story.publishedAt}>
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
      />
    </div>
  );
}
