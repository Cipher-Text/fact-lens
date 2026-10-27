import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import type { Lang, Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { RankedList } from "./RankedList";

type MostReadSectionProps = {
  lang: Lang;
  stories: Story[];
  t: Pick<Dictionary, "mostRead">;
  className?: string;
};

/**
 * P-5 MostReadSection (spacing-layout-system.md 7.2): the top 5 as a RankedList (C-07) in
 * the full shell, on the homepage and the category page. The SectionHeading across the
 * shell as in every section, then from 1024 a grid of three equal columns with the list in
 * the middle and end columns (1 to 3, then 4 and 5); the start column stays empty. Below
 * 1024 the list spans the shell. Sparse (7.3): the items that exist.
 */
export function MostReadSection({
  lang,
  stories,
  t,
  className,
}: MostReadSectionProps) {
  return (
    <Shell
      as="section"
      aria-labelledby="most-read-title"
      data-section="most-read"
      className={className}
    >
      <SectionHeading id="most-read-title">{t.mostRead.title}</SectionHeading>
      <div className="lg:grid lg:grid-cols-3 lg:gap-x-(--grid-column-gap)">
        <RankedList
          lang={lang}
          stories={stories}
          className="lg:col-span-2 lg:col-start-2"
        />
      </div>
    </Shell>
  );
}
