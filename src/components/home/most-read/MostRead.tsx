import Link from "next/link";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { headlineLink, storyHref } from "@/components/story/links";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

type MostReadProps = {
  stories: Story[];
  t: Pick<Dictionary, "mostRead">;
  className?: string;
};

/**
 * P-5 Most read, RankedList (component-system.md C-07; spacing-layout-system.md 7.2,
 * DR-51, DR-145): the top 5 as a numbered list in the full shell, not a card row.
 * 1 per row on phones, 2 from 600, 3 from 1024 (items 4 and 5 on row 2), 4 from 1280
 * (item 5 on row 2). Sparse (7.3): the items that exist.
 * The numeral is the .rank-list CSS counter (typography-system.md 7.1, type-rank):
 * bengali digits on Bangla pages, decimal on English pages, in text-interactive, hidden
 * from screen readers; the <ol> order gives the rank. An item is the title only: no
 * image, no meta, no rules. Column gap 24px; row gap 20px on phones, 24px from 600
 * (the sheet's values; the 3.1 tier gaps are smaller below 1024, DOC-32).
 */
export function MostRead({ stories, t, className }: MostReadProps) {
  return (
    <Shell
      as="section"
      aria-labelledby="most-read-title"
      data-section="most-read"
      className={className}
    >
      <SectionHeading id="most-read-title">{t.mostRead.title}</SectionHeading>
      {/* 3 and 4 columns are allowed here: a numbered list, not a card row (DR-44, DR-51, DR-145). */}
      <ol className="rank-list grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
        {stories.map((story) => (
          <li key={story.id} data-most-read-item className="min-w-0">
            <h3 className="type-story-title-sm">
              <Link href={storyHref(story)} className={headlineLink}>
                {story.title}
              </Link>
            </h3>
          </li>
        ))}
      </ol>
    </Shell>
  );
}
