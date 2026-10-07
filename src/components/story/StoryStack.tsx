import Image from "next/image";
import Link from "next/link";

import { listItem } from "@/components/home/analysis-opinion/classes";
import { BreakingLabel } from "@/components/story/StoryEyebrow";
import { headlineLink, storyHref } from "@/components/story/links";
import { StoryMeta } from "@/components/story/StoryMeta";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type StoryStackProps = {
  stories: Story[];
  strings: Dictionary["story"];
  /** Story title level: h3 under a section heading, h4 under a group heading in a section. */
  titleAs?: "h3" | "h4";
};

/**
 * A list of stories under a heading that names the group (a P-3 category, a P-3b
 * region): the first story as an image story (type-story-title), the others as compact
 * items (type-story-title-sm) with list rules. Not in the specs
 * (UNRESOLVED_DESIGN_SYSTEM U-21). The heading names the group, so the items show no
 * category label; a breaking story keeps its filled label (COL-11, U-20).
 */
export function StoryStack({
  stories,
  strings,
  titleAs: Title = "h3",
}: StoryStackProps) {
  return (
    <ul>
      {stories.map((story, index) => {
        const image = index === 0 ? story.image : undefined;
        return (
          <li key={story.id} className={listItem}>
            <article>
              {image ? (
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="mb-(--space-story-media-text) aspect-video w-full bg-surface-alt object-cover"
                />
              ) : null}
              {story.breaking ? (
                <p className="mb-(--space-eyebrow-title) type-eyebrow">
                  <BreakingLabel text={strings.breaking} />
                </p>
              ) : null}
              <Title
                className={cn(
                  index === 0 ? "type-story-title" : "type-story-title-sm",
                )}
              >
                <Link href={storyHref(story)} className={headlineLink}>
                  {story.title}
                </Link>
              </Title>
              <StoryMeta
                story={story}
                strings={strings}
                className="mt-(--space-story-title-meta)"
              />
            </article>
          </li>
        );
      })}
    </ul>
  );
}
