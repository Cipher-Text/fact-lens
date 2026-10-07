import { Shell } from "@/components/layout/Shell";
import { StoryStack } from "@/components/story/StoryStack";
import type { RegionBlock } from "@/content";
import type { Dictionary } from "@/i18n";

import { RegionSlider } from "./RegionSlider";

type RegionsProps = {
  regions: RegionBlock[];
  t: Pick<Dictionary, "regions" | "regionSlider" | "story">;
  className?: string;
};

/**
 * P-3b Regions (spacing-layout-system.md 7.2 to 7.4, DR-54) in the full shell (LAY-03).
 * Regions with no stories are already removed (7.3). চীন is a region here, not a nav
 * item (DR-19). The section id is the anchor of the অঞ্চল links (IMP-14).
 * The story stacks render on the server; only the slider and tabs are client code.
 */
export function Regions({ regions, t, className }: RegionsProps) {
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
        regions={regions.map(({ region, stories }) => ({
          id: region,
          label: t.regions[region],
          content: (
            <StoryStack stories={stories} strings={t.story} titleAs="h4" />
          ),
        }))}
      />
    </Shell>
  );
}
