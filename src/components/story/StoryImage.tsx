import Image from "next/image";
import Link from "next/link";

import type { Story } from "@/content";
import { cn } from "@/lib/utils";

import { storyHref } from "./links";

type StoryImageProps = {
  story: Story;
  /** Load the image without lazy loading: cards near the top of the page. */
  eager?: boolean;
  /** The Next.js `preload` flag, for the one image that is the largest paint (the lead). */
  preload?: boolean;
  className?: string;
  imageClassName?: string;
};

/**
 * The image part of a story unit (LeadStory.media, OverlapCard.media, StoryCard.media):
 * square corners, a link to the story with tabindex -1 and aria-hidden, so the story has one
 * tab stop (the title link). The caller sets the ratio on `imageClassName`. Renders nothing
 * for a story with no image (the sheets require an image: UNRESOLVED_DESIGN_SYSTEM U-33).
 */
export function StoryImage({
  story,
  eager,
  preload,
  className,
  imageClassName,
}: StoryImageProps) {
  const { image } = story;
  if (!image) return null;
  return (
    <Link
      href={storyHref(story)}
      tabIndex={-1}
      aria-hidden="true"
      data-story-media
      className={cn("block min-w-0", className)}
    >
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={eager ? "eager" : undefined}
        preload={preload}
        className={cn(
          "block w-full bg-surface-alt object-cover",
          imageClassName,
        )}
      />
    </Link>
  );
}
