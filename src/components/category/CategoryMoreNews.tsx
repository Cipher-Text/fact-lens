"use client";

import { useEffect, useRef, useState } from "react";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { Button } from "@/components/story/Button";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { CategoryCardList } from "./CategoryCards";

const PAGE_SIZE = 10;

type Props = {
  stories: Story[];
  t: Pick<Dictionary, "categoryPage" | "story" | "categories">;
  className?: string;
};

/**
 * The category page More news section (docs/briefs/category.md, section 8): the older
 * stories as StoryCard rows, as the card rows under the lead (tajmin's tweak at
 * checkpoint 5), 10 at a time. A story with no image shows the no-image placeholder
 * (DR-338). The Button (C-12 primary) adds the next 10 and goes when none are left. Focus moves to the title
 * link of the first added story, so a keyboard or screen reader user goes on reading
 * there. The list stays in the wrapper column, as the card rows above it; the rail column
 * is empty (tajmin, checkpoint 5).
 */
export function CategoryMoreNews({ stories, t, className }: Props) {
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
            {t.categoryPage.moreNews}
          </SectionHeading>
          <div ref={listRef}>
            <CategoryCardList stories={shown} t={t} />
          </div>
          {count < stories.length ? (
            <div className="mt-(--space-module) flex justify-center">
              <Button onClick={loadMore} data-load-more>
                {t.categoryPage.loadMore}
              </Button>
            </div>
          ) : null}
        </Wrapper>
      </WithRail>
    </Shell>
  );
}
