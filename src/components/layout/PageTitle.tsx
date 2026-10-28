import type { ReactNode } from "react";

import { Divider } from "@/components/layout/Divider";
import { Shell } from "@/components/layout/Shell";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** The h1 id, for a section the title names (the Latest page list). */
  id?: string;
  /** A line above the brand bar, in the band: the category page MissingTranslationNote. */
  note?: ReactNode;
  className?: string;
};

/**
 * PageTitle: the title of a page that is not the homepage or an article, as the page h1,
 * type-page-title, with Divider.section (C-22, the bar on the rule) above it and
 * space-section-rule-title between, as in SectionHeading. No description. Sheet: C-43.
 * A band (tajmin 28 Oct 2026): the surface background (color-system 2.1, an exception to
 * surface-alt for bands) spans the full width and the content sits in the shell, so it
 * lines up with the page. Block inset only, space-page-title-band: 24px under 600px, 32px
 * from 600px, 40px from 1024px (CPT-07). It is the first row of main, right under the
 * ad-top row: it takes the place of space-page-start. The page sets the space after it.
 * Every page that has a PageTitle shows the band.
 */
export function PageTitle({ title, id, note, className }: Props) {
  return (
    <header
      data-page-title
      className={cn("bg-surface py-(--space-page-title-band)", className)}
    >
      <Shell>
        {note}
        <Divider />
        <h1
          id={id}
          className="mt-(--space-section-rule-title) type-page-title text-ink"
        >
          {title}
        </h1>
      </Shell>
    </header>
  );
}
