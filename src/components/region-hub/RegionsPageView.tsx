import { Fragment } from "react";

import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { PageTitle } from "@/components/layout/PageTitle";
import type { RegionsPage } from "@/content";
import { getDictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { RegionsCoverSection } from "./RegionsCoverSection";
import { RegionsGroupedSection, regionGroups } from "./RegionsGroupedSection";

type Props = {
  page: RegionsPage;
};

/**
 * The region hub (layout 7C.2 Paths, Region hub row; page/regions brief). Page order:
 * header, ad-top, PageTitle with a description, the cover with the Latest rail, ad-band, the
 * region blocks with the rail ad, footer. No More stories (tajmin, 4 Nov 2026).
 */
export function RegionsPageView({ page }: Props) {
  const { lang } = page;
  const t = getDictionary(lang);
  const groups = regionGroups(page.regions);
  const regions = groups.length > 0;

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} path="/regions" />
      {/* The top ad row is below the header, full width (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={t.ads} />
      {/* tabIndex -1: the SkipLink target takes focus in every browser (DR-269). */}
      <main
        id="main"
        tabIndex={-1}
        className="pb-(--space-section) focus-visible:outline-none"
      >
        {/* The title band is the first row of main, under the ad-top row (C-43), with the
            short description below the title, as on the analysis hub (tajmin, 4 Nov 2026).
            The title is the nav label অঞ্চলসমূহ / Regions (DR-345). */}
        <PageTitle
          id="regions-title"
          title={t.regionsSection.title}
          description={t.regionsPage.description}
          className="mb-(--space-module)"
        />
        {/* The cover and the Latest rail. The ad band follows it, so the space before the ad
            row belongs to it (LAY-12); as the last row it adds none: main ends with
            space-section. */}
        {page.cover ? (
          <RegionsCoverSection
            cover={page.cover}
            latest={page.latest}
            t={t}
            className={cn(regions && "pb-(--space-module)")}
          />
        ) : null}
        {/* The regions in groups of 4, each with its rail ad, and a full-width ad band
            before each group: after the cover and between the groups (tajmin, 5 Nov 2026).
            With no cover the first group follows the title band with no band (7.3, LAY-13).
            The space before an ad row belongs to the group above it, the space after it to
            the group below (LAY-12); the last group adds none: main ends with space-section. */}
        {groups.map((group, index) => {
          const band = index > 0 || !!page.cover;
          return (
            <Fragment key={group[0].region}>
              {band ? (
                <AdSlot variant="band" lang={lang} strings={t.ads} />
              ) : null}
              <RegionsGroupedSection
                lang={lang}
                regions={group}
                t={t}
                className={cn(
                  band && "pt-(--space-module)",
                  index < groups.length - 1 && "pb-(--space-module)",
                )}
              />
            </Fragment>
          );
        })}
      </main>
      <Footer lang={lang} />
    </>
  );
}
