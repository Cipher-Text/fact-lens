"use client";

import { useEffect, useRef, useState } from "react";

import { Divider } from "@/components/layout/Divider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { Button } from "@/components/story/Button";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { CategoryMoreStoriesList } from "./CategoryCards";

const PAGE_SIZE = 10;

type Props = {
  stories: Story[];
  t: Pick<Dictionary, "categoryPage" | "story" | "categories">;
  className?: string;
};

/**
 * CategoryMoreStoriesSection (spacing-layout-system.md 7B): the older
 * stories as CategoryMoreStoriesList items, date | title and deck | image (tajmin, after
 * checkpoint 5), 10 at a time. A story with no image shows the no-image placeholder
 * (DR-338). Divider.rule (C-22), then the Button (C-12 primary), which adds the next 10; both go
 * when none are left. Focus moves to the title
 * link of the first added story, so a keyboard or screen reader user goes on reading
 * there. The list stays in the wrapper column, as the card rows above it; the rail column
 * is empty (tajmin, checkpoint 5).
 */
export function CategoryMoreStoriesSection({ stories, t, className }: Props) {
  const [count, setCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLDivElement>(null);
  // The index of the first story the last press added; null before any press.
  const focusFrom = useRef<number | null>(null);

  useEffect(() => {
    if (focusFrom.current === null) return;
    // The title link: the image link is out of the tab order (StoryImage).
    const items = listRef.current?.querySelectorAll("li");
    items?.[focusFrom.current]
      ?.querySelector<HTMLAnchorElement>("a:not([tabindex='-1'])")
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
      aria-labelledby="category-more-title"
      data-section="category-more"
      className={className}
    >
      <WithRail>
        <Wrapper data-category-more-wrapper>
          <SectionHeading id="category-more-title">
            {t.categoryPage.moreStories}
          </SectionHeading>
          <div ref={listRef}>
            <CategoryMoreStoriesList stories={shown} t={t} />
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
