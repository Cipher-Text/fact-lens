import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { Eyebrow, type EyebrowMode } from "./Eyebrow";
import { headlineLink, storyHref } from "./links";
import { MetaLine, storyMetaItems } from "./MetaLine";

type StoryListItemProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories" | "analysisOpinion">;
  /** category-time: Latest. time-reading: every other list (C-25). */
  meta?: "category-time" | "time-reading";
  /**
   * The C-08 Eyebrow above the title, in this mode; none when unset. The homepage region
   * columns use `format`: the category on news, বিশ্লেষণ / Analysis on analysis (DR-433, as
   * amended by tajmin, 30 Oct 2026).
   */
  eyebrowMode?: EyebrowMode;
  titleAs?: "h3" | "h4";
};

/**
 * C-25 StoryListItem: one story as a text row, title and meta, no image. The parent list
 * draws the padding and the rule between rows (Divider item). The title is one link in
 * type-story-title-sm and wraps; it is never cut (CPT-08). It has no Breaking label (COL-11, DR-279).
 */
export function StoryListItem({
  story,
  strings,
  meta = "time-reading",
  eyebrowMode,
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
      {eyebrowMode ? (
        <Eyebrow
          story={story}
          strings={strings}
          mode={eyebrowMode}
          className="mb-(--space-lead-eyebrow-title)"
        />
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
