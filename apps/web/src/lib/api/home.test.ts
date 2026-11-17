import { afterEach, describe, expect, it, vi } from "vitest";
import { mostReadSchema, publicNewsListSchema, publicRegionListSchema } from "@fact-lens/contracts";
import { homepageFromApi, regionPageFromApi, regionsPageFromApi } from "./home";

const media = { id: "11111111-1111-4111-8111-111111111111", width: 800, height: 600, alt: "Photo", attribution: null, license: null, urls: { thumb: "/thumb", card: "/card", hero: "/hero" } };
function item(n: number, options: { format?: "news" | "analysis" | "opinion"; category?: string; image?: boolean } = {}) {
  return {
    id: `22222222-2222-4222-8222-${String(n).padStart(12, "0")}`,
    shortId: `story${n}`, format: options.format ?? "news", slug: `story-${n}`, title: `Story ${n}`, dek: null,
    publishedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 60 - n)).toISOString(), readingMinutes: 2,
    category: { key: options.category ?? "geopolitics", name: "Geopolitics", slug: options.category ?? "geopolitics" }, image: options.image ? media : null,
  };
}
function list(items: ReturnType<typeof item>[]) {
  return publicNewsListSchema.parse({ filter: null, items, nextCursor: null });
}
function region(key: string) {
  return { key, name: key, slug: key, description: null };
}
function installFetch(resolver: (key: string) => unknown) {
  vi.stubEnv("FACTLENS_API_URL", "https://api.example");
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const body = resolver(`${url.pathname}${url.search}`);
    if (body === undefined) throw new Error(`Unexpected request ${url.pathname}${url.search}`);
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("API homepage and region adapters", () => {
  it("selects the first imaged hero lead and fills featured, analysis, ranked, and regional sources", async () => {
    installFetch((key) => {
      if (key === "/public/news/en?format=news&limit=50") return list([item(1), item(2, { image: true }), ...Array.from({ length: 6 }, (_, i) => item(i + 3))]);
      if (key === "/public/news/en?format=analysis&limit=3") return list([item(20, { format: "analysis" })]);
      if (key === "/public/news/en?format=opinion&limit=3") return list([item(21, { format: "opinion" })]);
      if (key === "/public/news/en?region=asia&excludeFormat=opinion&limit=4") return list([item(30), item(31)]);
      if (key === "/public/news/en?category=geopolitics&excludeFormat=opinion&limit=4") return list([item(40)]);
      if (key === "/public/news/en?category=geopolitics&format=news&limit=3") return list([item(50)]);
      if (key === "/public/news/en?category=security&format=news&limit=3") return list([]);
      if (key.includes("&format=news&limit=3")) return list([]);
      if (key === "/public/most-read/en?limit=5") return mostReadSchema.parse({ window: "24h", items: [{ ...item(60), rank: 4 }] });
      if (key === "/public/regions/en") return publicRegionListSchema.parse([region("asia"), region("unknown")]);
      if (key === "/public/news/en?region=asia&excludeFormat=opinion&limit=3") return list([item(70)]);
      return undefined;
    });
    const page = await homepageFromApi("en");
    expect(page.hero?.lead.id).toBe("story2");
    expect(page.hero?.top.map((story) => story.id)).toEqual(["story1", "story3"]);
    expect(page.featured.southAsia?.feature.id).toBe("story30");
    expect(page.featured.southAsia?.rail.map((story) => story.id)).toEqual(["story31"]);
    expect(page.featured.geopolitics?.feature.id).toBe("story40");
    expect(page.grouped?.categories.map((block) => block.category)).toEqual(["geopolitics"]);
    expect(page.analysisOpinion?.analysis[0].id).toBe("story20");
    expect(page.mostRead?.[0].rank).toBe(4);
    expect(page.regions?.map((block) => block.region)).toEqual(["asia"]);
  });

  it("leaves empty sections out and returns a null hero and most-read list", async () => {
    installFetch((key) => {
      if (key.startsWith("/public/news/en?category=")) return list([]);
      if (key.startsWith("/public/news/en?region=")) return list([]);
      if (key === "/public/news/en?format=news&limit=50" || key === "/public/news/en?format=analysis&limit=3" || key === "/public/news/en?format=opinion&limit=3" || key === "/public/news/en?region=asia&excludeFormat=opinion&limit=4" || key === "/public/news/en?category=geopolitics&excludeFormat=opinion&limit=4") return list([]);
      if (key === "/public/most-read/en?limit=5") return mostReadSchema.parse({ window: "24h", items: [] });
      if (key === "/public/regions/en") return publicRegionListSchema.parse([region("asia")]);
      return undefined;
    });
    const page = await homepageFromApi("en");
    expect(page.hero).toBeNull();
    expect(page.analysisOpinion).toBeNull();
    expect(page.featured).toEqual({ southAsia: null, geopolitics: null });
    expect(page.grouped).toBeNull();
    expect(page.mostRead).toBeNull();
    expect(page.regions).toBeNull();
  });

  it("uses only valid nonempty regions and builds their covers from newest imaged stories", async () => {
    installFetch((key) => {
      if (key === "/public/news/bn-BD?excludeFormat=opinion&limit=50") return list([item(1), item(2, { image: true }), item(3)]);
      if (key === "/public/regions/bn-BD") return publicRegionListSchema.parse([region("asia"), region("no-such-region"), region("europe")]);
      if (key === "/public/news/bn-BD?region=asia&excludeFormat=opinion&limit=3") return list([item(4)]);
      if (key === "/public/news/bn-BD?region=europe&excludeFormat=opinion&limit=3") return list([]);
      return undefined;
    });
    const page = await regionsPageFromApi("bn");
    expect(page.cover?.id).toBe("story2");
    expect(page.latest.map((story) => story.id)).toEqual(["story1", "story3"]);
    expect(page.regions.map((block) => block.region)).toEqual(["asia"]);
  });

  it("filters opinions, limits region results to ten, and rejects unknown slugs", async () => {
    const stories = Array.from({ length: 11 }, (_, i) => item(i + 1));
    installFetch((key) => key === "/public/news/en?region=asia&excludeFormat=opinion&limit=20" ? list(stories) : undefined);
    expect(await regionPageFromApi("en", "unknown")).toBeUndefined();
    const page = await regionPageFromApi("en", "asia");
    expect(page?.stories).toHaveLength(10);
    expect(page?.stories.every((story) => story.format !== "opinion" && story.regions.includes("asia"))).toBe(true);
  });
});
