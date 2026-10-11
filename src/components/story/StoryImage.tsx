import Image from "next/image";
import Link from "next/link";

import type { Story } from "@/content";
import { cn } from "@/lib/utils";

import { storyHref } from "./links";

/** Mock placeholder for a story with no image (public/mock). A real photo replaces it. */
const PLACEHOLDER = {
  src: "/mock/landscape-16x9.svg",
  alt: "",
  width: 1600,
  height: 900,
};

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
 * tab stop (the title link). The caller sets the ratio on `imageClassName`. The sheets require
 * an image (DR-91), so a story with no image of its own shows the placeholder image (U-33,
 * tajmin 11 October 2026). The placeholder is decorative: empty alt text.
 */
export function StoryImage({
  story,
  eager,
  preload,
  className,
  imageClassName,
}: StoryImageProps) {
  const image = story.image ?? PLACEHOLDER;
  return (
    <Link
      href={storyHref(story)}
      tabIndex={-1}
      aria-hidden="true"
      data-story-media
      data-placeholder={story.image ? undefined : ""}
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
