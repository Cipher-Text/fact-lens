"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Story } from "@/content";
import { cn } from "@/lib/utils";

import { storyHref } from "./links";

type StoryImageProps = {
  story: Story;
  /** Load the image without lazy loading: the hero cards (DR-325). */
  eager?: boolean;
  /** Preload the image and give it high fetch priority: the lead, the page LCP (DR-325). */
  preload?: boolean;
  className?: string;
  /** The caller sets the slot ratio here (aspect-3/2 or aspect-video). */
  imageClassName?: string;
};

/**
 * The image part of a story unit (LeadStory.media, OverlapCard.media, StoryCard.media):
 * square corners, a link to the story with tabindex -1 and aria-hidden, so the story has one
 * tab stop (the title link). When a story has no image, or the image does not load, the same
 * slot shows the no-image placeholder (DR-338): a flat surface-alt fill at the slot ratio, no
 * border, no mark, no text. It is decorative. Images load lazily unless the caller says
 * `eager` or `preload` (DR-325).
 */
export function StoryImage({
  story,
  eager,
  preload,
  className,
  imageClassName,
}: StoryImageProps) {
  const [failed, setFailed] = useState(false);
  const image = failed ? undefined : story.image;
  return (
    <Link
      href={storyHref(story)}
      tabIndex={-1}
      aria-hidden="true"
      data-story-media
      data-placeholder={image ? undefined : ""}
      className={cn("block min-w-0", className)}
    >
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={eager || preload ? "eager" : undefined}
          fetchPriority={preload ? "high" : undefined}
          preload={preload}
          onError={() => setFailed(true)}
          className={cn(
            "block w-full bg-surface-alt object-cover",
            imageClassName,
          )}
        />
      ) : (
        <span className={cn("block w-full bg-surface-alt", imageClassName)} />
      )}
    </Link>
  );
}
