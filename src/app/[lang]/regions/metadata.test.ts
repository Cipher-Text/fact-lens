import { describe, expect, it } from "vitest";

import { bn } from "@/i18n/bn";
import { en } from "@/i18n/en";

import { generateMetadata } from "./page";

// generateMetadata of the region hub: the title, the description of the PageTitle and the
// hreflang alternates. No robots rule.

async function metadataFor(lang: string) {
  return generateMetadata({
    params: Promise.resolve({ lang }),
  } as Parameters<typeof generateMetadata>[0]);
}

describe("region hub generateMetadata", () => {
  it.each([
    ["bn", bn],
    ["en", en],
  ] as const)(
    "%s: title, description, alternates, no robots",
    async (lang, t) => {
      const metadata = await metadataFor(lang);
      expect(metadata.title).toBe(t.regionsSection.title);
      expect(metadata.description).toBe(t.regionsPage.description);
      expect(metadata.alternates?.languages).toEqual({
        bn: "/regions",
        en: "/en/regions",
      });
      expect(metadata.robots).toBeUndefined();
    },
  );

  it("returns nothing for an unknown language", async () => {
    expect(await metadataFor("fr")).toEqual({});
  });
});
