import { AdSlot } from "@/components/ads/AdSlot";
import { CategoryBlock } from "@/components/home/grouped/CategoryBlock";
import { groupedRow } from "@/components/home/grouped/GroupedCategoriesSection";
import { dividerColumn } from "@/components/layout/Divider";
import { Rail } from "@/components/layout/Rail";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import type { Lang, RegionBlock } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";

type Props = {
  lang: Lang;
  regions: RegionBlock[];
  t: Dictionary;
  className?: string;
};

/** Regions per group: 2 rows of 2, then a full-width ad-band (tajmin, 5 Nov 2026). */
export const REGIONS_PER_GROUP = 4;

function pairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/** The regions in groups of REGIONS_PER_GROUP, in order; the last group holds the rest. */
export function regionGroups<T>(regions: T[]): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < regions.length; i += REGIONS_PER_GROUP)
    groups.push(regions.slice(i, i + REGIONS_PER_GROUP));
  return groups;
}

/**
 * RegionsGroupedSection: one group of region blocks on the region hub (page/regions brief),
 * laid out as P-3 GroupedCategoriesSection. The page splits the regions into groups of 4 with
 * a full-width ad-band between the groups (tajmin, 5 Nov 2026: "4 regions + 1 ad rail = 1
 * group then full width ad-band"). Wrapper: rows of two CategoryBlocks (C-23), one per region
 * with stories, in the region order (layout 7C.2, DR-411); 1 per row on phones, 2 from 600
 * (LAY-07). An odd last block keeps its size and the other half stays empty (7.3). Each block:
 * the feature story (StoryCard `top`), a StoryList of 3, the `format` Eyebrow on every story
 * (news the category, analysis বিশ্লেষণ / Analysis; tajmin, 5 Nov 2026) and a MoreLink to
 * the region page, /regions/<slug> (404 until the region page, IMP-18, IMP-128). No
 * ad-inset: the ad-band between the groups replaces it.
 * Rail: the ad-rail slot from 1024, one per group, as AnalysisTopSection; no poll (tajmin,
 * 5 Nov 2026).
 * Below 1024 the Rail is not drawn. From 1024 Divider.column-inset (16px from the top and the
 * bottom) sits in the middle of the gap between the wrapper and the rail, as in P-3 (tajmin,
 * 5 Nov 2026: "use inset vertical margin"). The source order is the reading order (LAY-14).
 */
export function RegionsGroupedSection({ lang, regions, t, className }: Props) {
  const rows = pairs(regions);
  return (
    <Shell as="div" data-section="regions-grouped" className={className}>
      <WithRail className={dividerColumn.rail}>
        <Wrapper
          data-regions-grouped-wrapper
          className="grid gap-y-(--space-module)"
        >
          {rows.map((row) => (
            <div
              key={row[0].region}
              data-regions-grouped-row
              className={groupedRow}
            >
              {row.map((block) => (
                <CategoryBlock
                  key={block.region}
                  name={`region-${block.region}`}
                  heading={t.regions[block.region]}
                  href={localizedPath(lang, `/regions/${block.region}`)}
                  stories={block.stories}
                  eyebrowMode="format"
                  t={t}
                />
              ))}
            </div>
          ))}
        </Wrapper>
        <Rail data-regions-grouped-rail className="max-lg:hidden">
          <AdSlot variant="rail" lang={lang} strings={t.ads} />
        </Rail>
      </WithRail>
    </Shell>
  );
}
