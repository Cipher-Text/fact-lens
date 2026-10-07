import Image from "next/image";
import Link from "next/link";

import { headlineLinkElevated, storyHref } from "@/components/story/links";
import { MoreLink } from "@/components/story/MoreLink";
import { StoryEyebrow } from "@/components/story/StoryEyebrow";
import { StoryMeta } from "@/components/story/StoryMeta";
import type { Lang, Story } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";

import { listItem } from "./classes";

type AnalysisListProps = {
  lang: Lang;
  stories: Story[];
  strings: Pick<
    Dictionary,
    "analysisOpinion" | "story" | "categories" | "common"
  >;
};

/**
 * The analysis column of P-4: an image-led list (spacing-layout-system.md 7.2). No chip on
 * this column (DR-77), so its heading is for screen readers only. The image sits at the
 * start of each item, the text beside it; a story with no image has the text only. The
 * item layout and image width are not in the specs (UNRESOLVED_DESIGN_SYSTEM U-15).
 */
export function AnalysisList({ lang, stories, strings }: AnalysisListProps) {
  return (
    <section aria-labelledby="analysis-title" data-column="analysis">
      <h3 id="analysis-title" className="sr-only">
        {strings.analysisOpinion.analysis}
      </h3>
      <ul>
        {stories.map((story) => (
          <li key={story.id} className={listItem}>
            <article className="flex items-start gap-x-(--space-story-media-text)">
              {story.image ? (
                <Image
                  src={story.image.src}
                  alt={story.image.alt}
                  width={story.image.width}
                  height={story.image.height}
                  className="aspect-video w-1/3 shrink-0 bg-surface-alt object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <StoryEyebrow
                  story={story}
                  strings={strings}
                  className="mb-(--space-eyebrow-title)"
                />
                <h4 className="type-story-title-sm">
                  <Link
                    href={storyHref(story)}
                    className={headlineLinkElevated}
                  >
                    {story.title}
                  </Link>
                </h4>
                {story.summary ? (
                  <p className="mt-(--space-story-title-summary) type-summary text-ink-secondary">
                    {story.summary}
                  </p>
                ) : null}
                <StoryMeta
                  story={story}
                  strings={strings.story}
                  className={
                    story.summary
                      ? "mt-(--space-story-summary-meta)"
                      : "mt-(--space-story-title-meta)"
                  }
                />
              </div>
            </article>
          </li>
        ))}
      </ul>
      <MoreLink
        href={localizedPath(lang, "/analysis")}
        section={strings.analysisOpinion.analysis}
        strings={strings.common}
        elevated
      />
    </section>
  );
}
