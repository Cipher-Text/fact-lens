import type { ReactNode } from "react";

import { Divider } from "@/components/layout/Divider";
import { Shell } from "@/components/layout/Shell";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** A line above the brand bar, in the band: the category page MissingTranslationNote. */
  note?: ReactNode;
  className?: string;
};

/**
 * PageTitle: the title of a page that is not the homepage or an article, as the page h1,
 * type-page-title, with Divider.section (C-22, the bar on the rule) above it and
 * space-section-rule-title between, as in SectionHeading. No description. Sheet: C-43.
 * A band (tajmin 28 Oct 2026): the surface background spans the full width and the
 * content sits in the shell, so it lines up with the page. Block values of the panel inset
 * only, 40px under 600px and 48px from 600px (LAY-20). It is the first row of main, right
 * under the ad-top row: it takes the place of space-page-start. The page sets the space
 * after it. Every page that has a PageTitle shows the band.
 */
export function PageTitle({ title, note, className }: Props) {
  return (
    <header
      data-page-title
      className={cn("bg-surface py-10 sm:py-12", className)}
    >
      <Shell>
        {note}
        <Divider />
        <h1 className="mt-(--space-section-rule-title) type-page-title text-ink">
          {title}
        </h1>
      </Shell>
    </header>
  );
}
