import Link from "next/link";

import { dividerItem, listInk } from "@/components/layout/Divider";
import { Chip } from "@/components/story/Chip";
import { headlineLink, storyHref } from "@/components/story/links";
import { MoreLink } from "@/components/story/MoreLink";
import { StoryTime } from "@/components/story/StoryTime";
import type { Lang, Story } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

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
 * (400, ink-muted). No image. Divider.item between rows (DR-299), over the text column only,
 * not the quote mark (DR-351). The gap after the quote mark is --grid-column-gap (DR-300).
 * Chip to the first item: space-section-title-after (20 / 24 / 24, DR-351).
 */
export function OpinionList({ lang, stories, strings }: OpinionListProps) {
  return (
    <div data-column="opinion">
      <p className="mb-(--space-section-title-after)">
        <Chip variant="label">{strings.analysisOpinion.opinion}</Chip>
      </p>
      <ul className={cn(listInk.titleMeta, "opinion-rule-start")}>
        {stories.map((story) => (
          <li key={story.id} className={dividerItem}>
            <article className="flex items-start gap-x-(--grid-column-gap)">
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
                <p
                  data-time
                  data-meta-line
                  className="type-metadata text-ink-muted"
                >
                  <StoryTime story={story} />
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
