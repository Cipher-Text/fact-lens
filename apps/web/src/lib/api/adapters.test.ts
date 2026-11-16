import { describe, expect, it } from "vitest";
import { publicMediaSchema, publicNewsListItemSchema, publicNewsSchema } from "@fact-lens/contracts";
import { imageFromMedia, siteCategory, siteRegions, storyFromListItem, storyFromNews } from "./adapters";

const media = publicMediaSchema.parse({
  id: "11111111-1111-4111-8111-111111111111", width: null, height: null, alt: null,
  attribution: null, license: null, urls: { thumb: "/thumb", card: "/card", hero: "/hero" },
});

const listItem = publicNewsListItemSchema.parse({
  id: "22222222-2222-4222-8222-222222222222", shortId: "abc123", format: "news", slug: "sample-story",
  title: "Sample story", dek: "A summary", publishedAt: "2026-01-02T03:04:05Z",
  category: { key: "economy", name: "Economy", slug: "economy" }, image: media,
});

const news = publicNewsSchema.parse({
  ...listItem, locale: "en", body: { type: "doc", content: [] }, seoTitle: null, seoDescription: null,
  updatedAt: "2026-01-02T03:04:05Z", contributors: [
    { contributor: { id: "33333333-3333-4333-8333-333333333333", kind: "person", displayName: "Writer One", bio: null, image: null, socialLinks: [] }, role: "editor" },
    { contributor: { id: "44444444-4444-4444-8444-444444444444", kind: "person", displayName: "Writer Two", bio: null, image: null, socialLinks: [] }, role: "author" },
  ], alternates: [], corrections: [], media: [], categories: [listItem.category], regions: [
    { key: "europe", name: "Europe", slug: "europe" }, { key: "unknown", name: "Unknown", slug: "unknown" },
    { key: "china", name: "China", slug: "china" },
  ], tags: [],
});

describe("API story adapters", () => {
  it("maps known categories and drops non-site categories", () => {
    expect(siteCategory({ key: "technology" })).toBe("technology");
    expect(siteCategory({ key: "bangladesh" })).toBeNull();
    expect(storyFromListItem({ ...listItem, category: { key: "bangladesh", name: "Bangladesh", slug: "bangladesh" } }, "en")).toBeNull();
  });

  it("filters regions without changing their order", () => {
    expect(siteRegions(news.regions)).toEqual(["europe", "china"]);
    expect(storyFromNews(news, "en")?.regions).toEqual(["europe", "china"]);
  });

  it("uses the API short id for list and detail stories and selects the first author", () => {
    expect(storyFromNews(news, "en")?.id).toBe(storyFromListItem(listItem, "en")?.id);
    expect(storyFromNews(news, "en")?.author).toEqual({ name: "Writer Two", slug: "44444444-4444-4444-8444-444444444444" });
    expect(storyFromListItem(listItem, "en")?.author).toBeUndefined();
  });

  it("maps media and uses fallback dimensions", () => {
    expect(imageFromMedia(null, "en")).toBeUndefined();
    expect(imageFromMedia(media, "en")).toEqual({ src: "/card", alt: "", width: 800, height: 600 });
    const partial = publicMediaSchema.parse({ ...media, width: 320, height: null, alt: "A photo" });
    expect(imageFromMedia(partial, "bn")).toEqual({ src: "/card", alt: "A photo", width: 320, height: 600 });
  });
});
