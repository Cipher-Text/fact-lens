import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import type { Lang, Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { RankedList } from "./RankedList";

type MostReadSectionProps = {
  lang: Lang;
  stories: Story[];
  t: Pick<Dictionary, "mostRead">;
  /** grid: the homepage. columns: the category page (see the comment below). */
  layout?: "grid" | "columns";
  className?: string;
};

/**
 * P-5 MostReadSection (spacing-layout-system.md 7.2): the top 5 as a RankedList (C-07) in
 * the full shell, not a card row. 3 and 4 columns are allowed because it is a numbered
 * list (DR-44, DR-51, DR-145). Sparse (7.3): the items that exist.
 *
 * The columns layout (category page, tajmin's redesign after checkpoint 5): the
 * SectionHeading across the shell as in every section, then from 1024 a grid of three equal
 * columns with the list in the middle and end columns (1 to 3, then 4 and 5); the start
 * column stays empty. Below 1024 the list spans the shell.
 */
export function MostReadSection({
  lang,
  stories,
  t,
  layout = "grid",
  className,
}: MostReadSectionProps) {
  return (
    <Shell
      as="section"
      aria-labelledby="most-read-title"
      data-section="most-read"
      data-layout={layout}
      className={className}
    >
      <SectionHeading id="most-read-title">{t.mostRead.title}</SectionHeading>
      {layout === "columns" ? (
        <div className="lg:grid lg:grid-cols-3 lg:gap-x-(--grid-column-gap)">
          <RankedList
            lang={lang}
            stories={stories}
            layout="columns"
            className="lg:col-span-2 lg:col-start-2"
          />
        </div>
      ) : (
        <RankedList lang={lang} stories={stories} />
      )}
    </Shell>
  );
}
