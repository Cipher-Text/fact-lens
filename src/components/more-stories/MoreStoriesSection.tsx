"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Divider } from "@/components/layout/Divider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { Button } from "@/components/story/Button";
import type { EyebrowMode } from "@/components/story/Eyebrow";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { refreshStoryTimes } from "@/lib/story-time";

import { MoreStoriesList } from "./MoreStoriesList";

const PAGE_SIZE = 10;

type Props = {
  stories: Story[];
  /**
   * The id of a heading outside the section that names it (the Latest page h1). Then the
   * section shows no SectionHeading of its own, and data-section is `section`.
   */
  labelledBy?: string;
  /** With `labelledBy`: the data-section name, "latest" (default) or "topic". */
  section?: "latest" | "topic";
  /** The category Eyebrow on every row (the Latest page). */
  eyebrow?: boolean;
  /** With `eyebrow` on: "format" shows the format on analysis rows (the topic page). */
  eyebrowMode?: EyebrowMode;
  t: Pick<
    Dictionary,
    "categoryPage" | "story" | "categories" | "analysisOpinion"
  >;
  className?: string;
};

/**
 * MoreStoriesSection (spacing-layout-system.md 7B): the older
 * stories as MoreStoriesList items, date | title and deck | image (tajmin, after
 * checkpoint 5), 10 at a time. A story with no image shows the no-image placeholder
 * (DR-338). Divider.rule (C-22), then the Button (C-12 primary), which adds the next 10; both go
 * when none are left. Focus moves to the title
 * link of the first added story, so a keyboard or screen reader user goes on reading
 * there. The list stays in the wrapper column, as the card rows above it; the rail column
 * is empty (tajmin, checkpoint 5). The Latest page reuses the section: the page title
 * names it, 10 show first, then 10 per press, each row with the category Eyebrow (tajmin,
 * 28 Oct 2026).
 */
export function MoreStoriesSection({
  stories,
  labelledBy,
  section = "latest",
  eyebrow = false,
  eyebrowMode,
  t,
  className,
}: Props) {
  const [count, setCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLDivElement>(null);
  // The index of the first story the last press added; null before any press.
  const focusFrom = useRef<number | null>(null);

  // The added rows have the server time text (Dhaka, no relative form). Give them the
  // reader text before the browser paints them, so the server text never shows (TYP-17).
  useLayoutEffect(() => {
    if (count > PAGE_SIZE) refreshStoryTimes();
  }, [count]);

  useEffect(() => {
    if (focusFrom.current === null) return;
    // The title link: the image link is out of the tab order (StoryImage), and the
    // Eyebrow link (Latest) comes before the title.
    const items = listRef.current?.querySelectorAll("li");
    items?.[focusFrom.current]
      ?.querySelector<HTMLAnchorElement>(":is(h2, h3) > a")
      ?.focus();
    focusFrom.current = null;
  }, [count]);

  const shown = stories.slice(0, count);
  const loadMore = () => {
    focusFrom.current = count;
    setCount((value) => value + PAGE_SIZE);
  };

  return (
    <Shell
      as="section"
      aria-labelledby={labelledBy ?? "category-more-title"}
      data-section={labelledBy ? section : "category-more"}
      className={className}
    >
      <WithRail>
        <Wrapper data-category-more-wrapper>
          {labelledBy ? null : (
            <SectionHeading id="category-more-title">
              {t.categoryPage.moreStories}
            </SectionHeading>
          )}
          <div ref={listRef}>
            {/* With no SectionHeading the titles are h2 under the page h1. */}
            <MoreStoriesList
              stories={shown}
              t={t}
              eyebrow={eyebrow}
              eyebrowMode={eyebrowMode}
              titleAs={labelledBy ? "h2" : "h3"}
              addedFrom={PAGE_SIZE}
            />
          </div>
          {/* Divider.rule, then the button; both go when no stories are left. */}
          {count < stories.length ? (
            <>
              <Divider variant="rule" className="mt-(--space-module)" />
              <div className="mt-(--space-module) flex justify-center">
                <Button onClick={loadMore} data-load-more>
                  {t.categoryPage.loadMore}
                </Button>
              </div>
            </>
          ) : null}
        </Wrapper>
      </WithRail>
    </Shell>
  );
}
