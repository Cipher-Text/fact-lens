import { describe, expect, it } from "vitest";

import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";

import { generateMetadata } from "./page";

// generateMetadata of the analysis hub: the title, the description of the PageTitle and the
// hreflang alternates. No robots rule (tajmin, 2 Nov 2026).

async function metadataFor(lang: string) {
  return generateMetadata({
    params: Promise.resolve({ lang }),
  } as Parameters<typeof generateMetadata>[0]);
}

describe("analysis hub generateMetadata", () => {
  it.each([
    ["bn", bn],
    ["en", en],
  ] as const)(
    "%s: title, description, alternates, no robots",
    async (lang, t) => {
      const metadata = await metadataFor(lang);
      expect(metadata.title).toBe(t.analysisOpinion.analysis);
      expect(metadata.description).toBe(t.analysisPage.description);
      expect(metadata.alternates?.languages).toEqual({
        bn: "/analysis",
        en: "/en/analysis",
      });
      expect(metadata.robots).toBeUndefined();
    },
  );

  it("returns nothing for an unknown language", async () => {
    expect(await metadataFor("fr")).toEqual({});
  });
});
