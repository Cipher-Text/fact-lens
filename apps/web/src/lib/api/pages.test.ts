import { afterEach, describe, expect, it, vi } from "vitest";
import { mostReadSchema, publicNewsListSchema } from "@fact-lens/contracts";
import { analysisPageFromApi, categoryPageFromApi, topicPageFromApi } from "./pages";

const media = { id: "11111111-1111-4111-8111-111111111111", width: 800, height: 600, alt: "Photo", attribution: null, license: null, urls: { thumb: "/thumb", card: "/card", hero: "/hero" } };
function item(n: number, format: "news" | "analysis" | "opinion" = "news", image = false) {
  return {
    id: `22222222-2222-4222-8222-${String(n).padStart(12, "0")}`,
    shortId: `story${n}`, format, slug: `story-${n}`, title: `Story ${n}`, dek: null,
    publishedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 50 - n)).toISOString(), readingMinutes: 2,
    category: { key: "geopolitics", name: "Geopolitics", slug: "geopolitics" }, image: image ? media : null,
  };
}
function list(items: ReturnType<typeof item>[], filter: { type: "tag"; name: string; slug: string } | null = null) {
  return publicNewsListSchema.parse({ filter: filter ? { ...filter, description: null, image: null } : null, items, nextCursor: null });
}
function installFetch(responses: Record<string, unknown>) {
  vi.stubEnv("FACTLENS_API_URL", "https://api.example");
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const key = `${url.pathname}${url.search}`;
    const body = responses[key];
    if (body === undefined) throw new Error(`Unexpected request ${key}`);
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("API page adapters", () => {
  it("selects category cover, latest, cards and more, excludes opinion from more, and preserves ranking", async () => {
    const news = Array.from({ length: 15 }, (_, i) => item(i + 1, "news", i === 0 || i >= 7));
    const analysis = Array.from({ length: 6 }, (_, i) => item(20 + i, "analysis"));
    const opinion = Array.from({ length: 5 }, (_, i) => item(30 + i, "opinion"));
    const ranked = mostReadSchema.parse({ window: "24h", items: [item(40), item(41)].map((story, i) => ({ ...story, rank: i + 1 })) });
    installFetch({
      "/public/news/en?category=geopolitics&format=news&limit=50": list(news),
      "/public/news/en?category=geopolitics&format=analysis&limit=5": list(analysis.slice(0, 5)),
      "/public/news/en?category=geopolitics&format=opinion&limit=5": list(opinion),
      "/public/most-read/en?category=geopolitics&limit=5": ranked,
    });
    const page = await categoryPageFromApi("geopolitics", "en");
    expect(page.cover?.id).toBe("story1");
    expect(page.latest.map((story) => story.id)).toEqual(["story2", "story3", "story4", "story5", "story6"]);
    expect(page.cards.map((story) => story.id)).toEqual(["story8", "story9", "story10"]);
    expect(page.analysis).toHaveLength(5);
    expect(page.opinion).toHaveLength(5);
    expect(page.more).toHaveLength(6);
    expect(page.more.every((story) => story.format !== "opinion")).toBe(true);
    expect(page.mostRead.map((story) => story.rank)).toEqual([1, 2]);
  });

  it("builds analysis counts and resolves a topic's localized tag reference", async () => {
    const analysis = Array.from({ length: 20 }, (_, i) => item(i + 1, "analysis"));
    const tagFilter = { type: "tag" as const, name: "বিশ্ব রাজনীতি", slug: "world-politics" };
    installFetch({
      "/public/news/bn-BD?format=analysis&limit=50": list(analysis),
      "/public/news/bn-BD?tag=world-politics&limit=50": list([item(1), item(2, "analysis"), item(3, "opinion")], tagFilter),
    });
    const page = await analysisPageFromApi("bn");
    expect(page.cover?.id).toBe("story1");
    expect(page.top).toHaveLength(4);
    expect(page.more).toHaveLength(10);
    const topic = await topicPageFromApi("world-politics", "bn");
    expect(topic?.topic).toEqual({ id: "world-politics", slug: "world-politics", label: "বিশ্ব রাজনীতি" });
    expect(topic?.stories.map((story) => story.format)).toEqual(["news", "analysis"]);
  });

  it("returns null when the requested localized tag does not exist", async () => {
    installFetch({ "/public/news/en?tag=missing&limit=50": list([], null) });
    await expect(topicPageFromApi("missing", "en")).resolves.toBeNull();
  });
});
