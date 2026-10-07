import Image from "next/image";
import Link from "next/link";

import { PeerCard } from "@/components/layout/PeerRow";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { headlineLink, storyHref } from "./links";
import { StoryEyebrow } from "./StoryEyebrow";
import { StoryMeta } from "./StoryMeta";

type StoryCardProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories">;
  /** The headline role. Top stories in the hero use type-story-title-lg (typography 7.1). */
  titleClass?: string;
  /** Load the image without lazy loading: cards near the top of the page (hero). */
  eager?: boolean;
  className?: string;
};

/**
 * A story card in a PeerRow. Five parts, one subgrid row each: image, eyebrow, title,
 * summary, metadata (spacing-layout-system.md Section 8). A missing part leaves its row
 * empty, so the parts line up across the row (LAY-08). Neutral card look (U-02).
 */
export function StoryCard({
  story,
  strings,
  titleClass = "type-story-title",
  eager = false,
  className,
}: StoryCardProps) {
  return (
    <PeerCard as="article" parts={5} className={className}>
      {story.image ? (
        <Image
          src={story.image.src}
          alt={story.image.alt}
          width={story.image.width}
          height={story.image.height}
          loading={eager ? "eager" : undefined}
          className="row-start-1 mb-(--space-story-media-text) aspect-video w-full bg-surface-alt object-cover"
        />
      ) : null}
      <StoryEyebrow
        story={story}
        strings={strings}
        className="row-start-2 mb-(--space-eyebrow-title)"
      />
      {/* Margins sit on the part above, so a missing summary keeps the metadata row aligned. */}
      <h3
        className={cn(
          "row-start-3 mb-(--space-story-title-summary)",
          titleClass,
        )}
      >
        <Link href={storyHref(story)} className={headlineLink}>
          {story.title}
        </Link>
      </h3>
      {story.summary ? (
        <p className="row-start-4 mb-(--space-story-summary-meta) type-summary text-ink-secondary">
          {story.summary}
        </p>
      ) : null}
      <StoryMeta
        story={story}
        strings={strings.story}
        className="row-start-5"
      />
    </PeerCard>
  );
}
