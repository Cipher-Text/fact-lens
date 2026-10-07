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
 * P-5 Most read (spacing-layout-system.md 7.2, DR-51): the top 5 as a numbered list in
 * the full shell, not a card row. 4 per row from 1024px with item 5 alone on row 2 (8),
 * 2 per row from 600px, 1 per row on phones. Sparse (7.3): the items that exist.
 * The numeral is the .rank-list CSS counter (typography-system.md 7.1, type-rank):
 * bengali digits on Bangla pages, decimal on English pages, in text-interactive, hidden
 * from screen readers; the <ol> order gives the rank.
 * An item is the title only, with no gap token between rows (UNRESOLVED_DESIGN_SYSTEM
 * U-27): type-story-title-sm, space-module between rows.
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
      {/* 4 columns from 1024 is allowed here: a numbered list, not a card row (DR-44, DR-51). */}
      <ol className="rank-list grid grid-cols-1 gap-x-(--grid-column-gap) gap-y-(--space-module) sm:grid-cols-2 lg:grid-cols-4">
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
