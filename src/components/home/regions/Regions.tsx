import { dividerItem } from "@/components/layout/Divider";
import { Shell } from "@/components/layout/Shell";
import { MoreLink } from "@/components/story/MoreLink";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryListItem } from "@/components/story/StoryListItem";
import type { Lang, RegionBlock } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";

import { RegionSlider } from "./RegionSlider";

type RegionsProps = {
  lang: Lang;
  regions: RegionBlock[];
  t: Pick<
    Dictionary,
    "regions" | "regionSlider" | "story" | "categories" | "common"
  >;
  className?: string;
};

/** Stories in one region panel: an image story and two text stories (C-15). */
const STORIES_PER_REGION = 3;

/**
 * P-3b RegionsSection (spacing-layout-system.md 7.2 to 7.4) in the full shell (LAY-03).
 * Regions with no stories are already removed (7.3). চীন is a region here, not a nav item
 * (DR-19). Each RegionSlider.panel is the region name (h3), a 3:2 image story and two text
 * stories with rules between; no "more" link per column. One MoreLink at the section end
 * links to the regions page (DR-142, DR-160). The section id is the anchor of the অঞ্চল
 * links (IMP-14). The panels render on the server; only the slider and tabs are client code.
 */
export function Regions({ lang, regions, t, className }: RegionsProps) {
  return (
    <Shell
      as="section"
      id="regions"
      aria-labelledby="regions-title"
      data-section="regions"
      className={className}
    >
      <RegionSlider
        title={t.regions.title}
        strings={t.regionSlider}
        regions={regions.map(({ region, stories }) => {
          const [lead, ...rest] = stories.slice(0, STORIES_PER_REGION);
          return {
            id: region,
            label: t.regions[region],
            content: (
              <ul>
                <li className={dividerItem}>
                  <StoryCard
                    story={lead}
                    strings={t}
                    ratio="3:2"
                    size="sm"
                    eyebrow={false}
                    summary={false}
                    titleAs="h4"
                  />
                </li>
                {rest.map((story) => (
                  <li key={story.id} className={dividerItem}>
                    <StoryListItem story={story} strings={t} titleAs="h4" />
                  </li>
                ))}
              </ul>
            ),
          };
        })}
      />
      <MoreLink
        href={localizedPath(lang, "/regions")}
        section={t.regions.title}
        strings={t.common}
      />
    </Shell>
  );
}
