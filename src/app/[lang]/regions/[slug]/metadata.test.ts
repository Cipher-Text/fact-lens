import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RegionPage, Story } from "@/content";

// generateMetadata of the region page with a mocked loader: the title is the region name,
// and below 3 stories the page is noindex, follow, as the topic page (DR-432, layout 7E.2;
// page/region brief).
const getRegionPage = vi.fn<(lang: string, slug: string) => RegionPage>();
vi.mock("@/content", () => ({
  getRegionPage: (lang: string, slug: string) => getRegionPage(lang, slug),
  getRegionSlugs: () => [],
}));

const { generateMetadata } = await import("./page");

function regionWith(count: number): RegionPage {
  return {
    lang: "en",
    region: "china",
    stories: Array.from(
      { length: count },
      (_, i) => ({ id: `s${i}` }) as Story,
    ),
  };
}

async function metadataFor(count: number) {
  getRegionPage.mockReturnValue(regionWith(count));
  return generateMetadata({
    params: Promise.resolve({ lang: "en", slug: "china" }),
  } as Parameters<typeof generateMetadata>[0]);
}

describe("region page generateMetadata (DR-432)", () => {
  beforeEach(() => getRegionPage.mockReset());

  it("is noindex, follow with 0 and 2 stories", async () => {
    for (const count of [0, 2]) {
      expect((await metadataFor(count)).robots).toEqual({
        index: false,
        follow: true,
      });
    }
  });

  it("sets no robots rule with 3 stories; the title is the region name", async () => {
    const metadata = await metadataFor(3);
    expect(metadata.robots).toBeUndefined();
    expect(metadata.title).toBe("China");
    expect(metadata.alternates?.languages).toEqual({
      bn: "/regions/china",
      en: "/en/regions/china",
    });
  });
});
