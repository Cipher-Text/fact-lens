import { dividerItem, listInk } from "@/components/layout/Divider";
import { Shell } from "@/components/layout/Shell";
import { MoreLink } from "@/components/story/MoreLink";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryListItem } from "@/components/story/StoryListItem";
import type { Lang, RegionBlock } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";

import { RegionSlider } from "./RegionSlider";

type RegionsSectionProps = {
  lang: Lang;
  regions: RegionBlock[];
  t: Pick<
    Dictionary,
    | "regions"
    | "regionsSection"
    | "regionSlider"
    | "story"
    | "analysisOpinion"
    | "categories"
    | "common"
  >;
  className?: string;
};

/** Stories in one region panel: an image story and two text stories (C-15). */
const STORIES_PER_REGION = 3;

/**
 * P-3b RegionsSection (spacing-layout-system.md 7.2 to 7.4) in the full shell (LAY-03).
 * Regions with no stories are already removed (7.3). চীন is a region here, not a nav item
 * (DR-19). Each RegionSlider.panel is the region name (h3), a 3:2 image story and two text
 * stories with rules between; no "more" link per column. Every story shows the C-08
 * `format` Eyebrow above its title: the category on news, বিশ্লেষণ / Analysis on analysis
 * (DR-433, as amended by tajmin, 30 Oct 2026; the hero uses the same mode, DR-417). One MoreLink at the section end
 * links to the regions page (DR-142, DR-160). The section id is the anchor of the অঞ্চলসমূহ
 * links (IMP-14). The panels render on the server; only the slider and tabs are client code.
 */
export function RegionsSection({
  lang,
  regions,
  t,
  className,
}: RegionsSectionProps) {
  return (
    <Shell
      as="section"
      id="regions"
      aria-labelledby="regions-title"
      data-section="regions"
      className={className}
    >
      <RegionSlider
        title={t.regionsSection.title}
        strings={t.regionSlider}
        regions={regions.map(({ region, stories }) => {
          const [lead, ...rest] = stories.slice(0, STORIES_PER_REGION);
          return {
            id: region,
            label: t.regions[region],
            content: (
              <ul className={listInk.titleMeta}>
                <li className={dividerItem}>
                  <StoryCard
                    story={lead}
                    strings={t}
                    ratio="3:2"
                    size="sm"
                    eyebrowMode="format"
                    summary={false}
                    titleAs="h4"
                  />
                </li>
                {rest.map((story) => (
                  <li key={story.id} className={dividerItem}>
                    <StoryListItem
                      story={story}
                      strings={t}
                      eyebrowMode="format"
                      titleAs="h4"
                    />
                  </li>
                ))}
              </ul>
            ),
          };
        })}
      />
      <MoreLink
        href={localizedPath(lang, "/regions")}
        section={t.regionsSection.title}
        strings={t.common}
      />
    </Shell>
  );
}
