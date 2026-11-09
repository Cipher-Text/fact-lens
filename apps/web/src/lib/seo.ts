import type { Metadata } from "next";

// Search engine rules of the list pages (spacing-layout-system.md 7E; DR-432).

/** A topic page with fewer stories than this is noindex, follow. */
export const TOPIC_INDEX_MIN_STORIES = 3;

/**
 * The robots rule of a topic page: noindex, follow below 3 stories, so a thin page stays out
 * of the index while its story links are still followed. From 3 stories, nothing is set (the
 * default, index and follow).
 */
export function topicRobots(storyCount: number): Metadata["robots"] {
  return storyCount < TOPIC_INDEX_MIN_STORIES
    ? { index: false, follow: true }
    : undefined;
}
