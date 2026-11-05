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
  /** A short line below the title, in the band: the analysis hub (tajmin, 2 Nov 2026). */
  description?: string;
  className?: string;
};

/**
 * PageTitle: the title of a page that is not the homepage or an article, as the page h1,
 * text-6xl, with Divider.section (C-22, the bar on the rule) above it and
 * space-section-rule-title between, as in SectionHeading. Sheet: C-43. The optional
 * description sits below the title: text-lg (deck, 16 to 20px; DR-454; before: tajmin, 3 Nov
 * 2026), ink-secondary, 12px after the title as the article deck (tajmin, 2 Nov 2026). No
 * measure cap: it runs the width of the shell and wraps only when the shell is narrower
 * (tajmin, 3 Nov 2026: "dont wrap the text").
 * A band (tajmin 28 Oct 2026): --color-page-title-band, surface in light and dark (DR-424,
 * DR-425; color-system 2.9), spans the full width and the content sits in the shell, so it
 * lines up with the page. Block inset only, space-page-title-band: 24px under 600px, 32px
 * from 600px, 40px from 1024px (CPT-07). It is the first row of main, right under the
 * ad-top row: it takes the place of space-page-start. The page sets the space after it.
 * Every page that has a PageTitle shows the band.
 */
export function PageTitle({ title, id, note, description, className }: Props) {
  return (
    <header
      data-page-title
      className={cn(
        "bg-(--color-page-title-band) py-(--space-page-title-band)",
        className,
      )}
    >
      <Shell>
        {note}
        <Divider />
        <h1
          id={id}
          className="mt-(--space-section-rule-title) font-editorial text-6xl font-semibold text-balance text-ink"
        >
          {title}
        </h1>
        {description ? (
          <p
            data-page-title-description
            className="mt-3 font-editorial text-lg leading-relaxed font-normal text-ink-secondary"
          >
            {description}
          </p>
        ) : null}
      </Shell>
    </header>
  );
}
