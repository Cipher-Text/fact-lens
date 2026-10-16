import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

import { RankedList } from "./RankedList";

type MostReadSectionProps = {
  stories: Story[];
  t: Pick<Dictionary, "mostRead">;
  className?: string;
};

/**
 * P-5 MostReadSection (spacing-layout-system.md 7.2): the top 5 as a RankedList (C-07) in
 * the full shell, not a card row. 3 and 4 columns are allowed because it is a numbered
 * list (DR-44, DR-51, DR-145). Sparse (7.3): the items that exist.
 */
export function MostReadSection({
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
      <RankedList stories={stories} />
    </Shell>
  );
}
