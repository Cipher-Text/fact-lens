import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { Chip } from "./Chip";
import { headlineLink, storyHref } from "./links";
import { MetaLine, storyMetaItems } from "./MetaLine";

type StoryListItemProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories">;
  /** category-time: Latest. time-reading: every other list (C-25). */
  meta?: "category-time" | "time-reading";
  titleAs?: "h3" | "h4";
};

/**
 * C-25 StoryListItem: one story as a text row, title and meta, no image. The parent list
 * draws the padding and the rule between rows (Divider item). The title is one link in
 * type-story-title-sm and wraps; it is never cut (CPT-08). A Breaking story shows the filled
 * label above the title (COL-11); the sheet has no eyebrow part (UNRESOLVED_DESIGN_SYSTEM U-20).
 */
export function StoryListItem({
  story,
  strings,
  meta = "time-reading",
  titleAs: Title = "h3",
}: StoryListItemProps) {
  const items = storyMetaItems(story, strings.story, {
    readingTime: meta === "time-reading",
  });
  if (meta === "category-time") {
    items.unshift(
      <span key="category">{strings.categories[story.category]}</span>,
    );
  }
  return (
    <article data-story-list-item>
      {story.breaking ? (
        <p className="mb-(--space-lead-eyebrow-title) type-eyebrow">
          <Chip variant="live">{strings.story.breaking}</Chip>
        </p>
      ) : null}
      <Title className="type-story-title-sm">
        <Link href={storyHref(story)} className={headlineLink}>
          {story.title}
        </Link>
      </Title>
      <MetaLine items={items} className="mt-(--space-story-title-meta)" />
    </article>
  );
}
