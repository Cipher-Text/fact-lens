import { Fragment } from "react";

import { AdSlot } from "@/components/ads/AdSlot";
import { Rail } from "@/components/layout/Rail";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import type { CategoryBlock as CategoryBlockData, Lang, Poll } from "@/content";
import type { Dictionary } from "@/i18n";

import { CategoryBlock } from "./CategoryBlock";
import { DailyPoll } from "./DailyPoll";

/** The homepage has 3 ad-inset slots or fewer (spacing-layout-system.md Section 9). */
export const MAX_INSETS = 3;

type GroupedCategoriesSectionProps = {
  lang: Lang;
  categories: CategoryBlockData[];
  poll: Poll;
  t: Dictionary;
  className?: string;
};

function pairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/**
 * P-3 Grouped categories (spacing-layout-system.md 7.2 to 7.4 and 9). The wrapper has
 * rows of two categories (one per row on phones, LAY-07) with an ad-inset between rows,
 * at wrapper width; rows after the third inset have none. An odd last category keeps
 * its size and the other half of its row stays empty (7.3). The rail has the daily poll
 * (DR-239) and, from 1280px, the ad-rail space-module below it (DR-240, DR-242); below
 * 1024px the rail is under the wrapper (LAY-05). The source order is the phone reading
 * order: A, B, ad, C, D, poll (LAY-14).
 */
export function GroupedCategoriesSection({
  lang,
  categories,
  poll,
  t,
  className,
}: GroupedCategoriesSectionProps) {
  const rows = pairs(categories);
  return (
    <Shell as="div" data-section="grouped" className={className}>
      <WithRail>
        <Wrapper data-grouped-wrapper className="grid gap-y-(--space-module)">
          {rows.map((row, index) => (
            <Fragment key={row[0].category}>
              {index > 0 && index <= MAX_INSETS ? (
                <AdSlot variant="inset" lang={lang} strings={t.ads} />
              ) : null}
              <div
                data-grouped-row
                className="grid grid-cols-1 gap-x-(--grid-column-gap) gap-y-(--grid-row-gap) sm:grid-cols-2"
              >
                {row.map((block) => (
                  <CategoryBlock
                    key={block.category}
                    lang={lang}
                    block={block}
                    t={t}
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </Wrapper>
        <Rail
          data-grouped-rail
          className="flex flex-col gap-y-(--space-module)"
        >
          <DailyPoll poll={poll} strings={t.poll} />
          <AdSlot variant="rail" lang={lang} strings={t.ads} />
        </Rail>
      </WithRail>
    </Shell>
  );
}
