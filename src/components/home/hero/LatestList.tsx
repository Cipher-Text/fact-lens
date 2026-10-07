import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { headlineLink, storyHref, textLink } from "@/components/story/links";
import { BreakingLabel } from "@/components/story/StoryEyebrow";
import { StoryMeta } from "@/components/story/StoryMeta";
import type { Lang, Story } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";
import { fill } from "@/lib/format";

type LatestListProps = {
  lang: Lang;
  stories: Story[];
  strings: Pick<Dictionary, "hero" | "story" | "common">;
};

// The rule between items has space-list-item on each side. The first item has no rule;
// in 2 columns (600–1023px) the first two items have none.
const item =
  "mt-(--space-list-item) border-t border-border pt-(--space-list-item) first:mt-0 first:border-t-0 first:pt-0 sm:max-lg:nth-2:mt-0 sm:max-lg:nth-2:border-t-0 sm:max-lg:nth-2:pt-0";

/**
 * The Latest rail of P-1: the items that exist (5 to 6 in full content, Section 7.3),
 * then the "আরও দেখুন" link below the last item (LAY-18). One column in the rail from
 * 1024px, two columns at 600–1023px, one column on phones (Section 7.2).
 */
export function LatestList({ lang, stories, strings }: LatestListProps) {
  return (
    <section aria-labelledby="latest-title" data-latest>
      <SectionHeading as="h3" id="latest-title">
        {strings.hero.latest}
      </SectionHeading>
      <ul className="grid grid-cols-1 gap-x-(--grid-column-gap) sm:grid-cols-2 lg:grid-cols-1">
        {stories.map((story) => (
          <li key={story.id} className={item}>
            {story.breaking ? (
              <p className="mb-(--space-eyebrow-title) type-eyebrow">
                <BreakingLabel text={strings.story.breaking} />
              </p>
            ) : null}
            <p className="type-story-title-sm">
              <Link href={storyHref(story)} className={headlineLink}>
                {story.title}
              </Link>
            </p>
            <StoryMeta
              story={story}
              strings={strings.story}
              readingTime={false}
              className="mt-(--space-story-title-meta)"
            />
          </li>
        ))}
      </ul>
      <p className="mt-(--space-more-link) type-ui-sm">
        <Link
          href={localizedPath(lang, "/latest")}
          aria-label={fill(strings.common.moreAbout, {
            section: strings.hero.latest,
          })}
          className={textLink}
        >
          {strings.common.more}
        </Link>
      </p>
    </section>
  );
}
