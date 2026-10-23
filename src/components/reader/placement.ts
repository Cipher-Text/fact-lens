import type { Block } from "@/content";

/**
 * Where the context card goes in the body: before the first section heading. An article
 * with no heading gets it before the first paragraph, and one with neither at the top, so
 * the card is never dropped.
 */
export function contextPosition(blocks: Block[]): number {
  const heading = blocks.findIndex((block) => block.type === "h2");
  if (heading !== -1) return heading;
  const paragraph = blocks.findIndex((block) => block.type === "p");
  return paragraph !== -1 ? paragraph : 0;
}
