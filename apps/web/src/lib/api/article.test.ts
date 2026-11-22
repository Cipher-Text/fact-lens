import { afterEach, describe, expect, it, vi } from "vitest";
import { publicNewsSchema } from "@fact-lens/contracts";
import { articleFromApi, articleFromNews, blocksFromBody } from "./article";

const mediaId = "11111111-1111-4111-8111-111111111111";
const authorId = "22222222-2222-4222-8222-222222222222";
const fixture = publicNewsSchema.parse({
  id: "33333333-3333-4333-8333-333333333333", shortId: "abc123", format: "news", locale: "en", slug: "sample-story",
  title: "Sample story", dek: "A short summary", body: { type: "doc", content: [] }, seoTitle: null, seoDescription: null, readingMinutes: 2,
  publishedAt: "2026-01-02T03:04:05Z", updatedAt: "2026-01-03T03:04:05Z",
  contributors: [{ contributor: { id: authorId, kind: "person", displayName: "Ada Lovelace", bio: "Writer", image: null, socialLinks: [] }, role: "author" }],
  alternates: [], corrections: [{ approvedAt: "2026-01-03T03:04:05Z", notice: "A correction." }],
  media: [{ id: mediaId, width: 1200, height: 800, alt: "River", attribution: "Photo desk", license: null, urls: { thumb: "/thumb", card: "/card", hero: "/hero" } }],
  leadImage: { id: mediaId, width: 1200, height: 800, alt: "River", attribution: "Photo desk", license: null, urls: { thumb: "/thumb", card: "/card", hero: "/hero" } },
  category: { key: "economy", name: "Economy", slug: "economy" }, categories: [], regions: [], tags: [{ key: "climate", name: "Climate", slug: "climate" }],
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("article API adapter", () => {
  it("maps text nodes, drops marks, and makes heading ids unique", () => {
    const body = { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "Hello", marks: [{ type: "bold" }] }, { type: "text", text: " world" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Same heading" }] },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Same heading" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "One" }] }] }] },
      { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Two" }] }] }] },
      { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Quoted" }] }] },
      { type: "horizontalRule" },
    ] } as never;
    const parsed = publicNewsSchema.shape.body.parse(body);
    const result = blocksFromBody({ ...parsed, content: [...parsed.content, { type: "unsupportedNode" }] } as never, [], "en");
    expect(result.blocks).toEqual([
      { type: "p", text: "Hello world" }, { type: "h2", id: "same-heading", text: "Same heading" },
      { type: "h2", id: "same-heading-2", text: "Same heading" }, { type: "list", items: ["One"] },
      { type: "list", items: ["Two"] }, { type: "p", text: "Quoted" },
    ]);
    expect(result.dropped).toEqual(["unsupportedNode"]);
  });

  it("keeps a known media figure and drops an unknown media reference", () => {
    const parsed = publicNewsSchema.shape.body.parse({ type: "doc", content: [
      { type: "image", attrs: { mediaAssetId: mediaId, alt: "Inline" } },
      { type: "image", attrs: { mediaAssetId: authorId } },
    ] });
    const result = blocksFromBody(parsed, fixture.media, "en");
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({ type: "figure", caption: "River", credit: "Photo desk", alt: "River" });
    expect(result.dropped).toEqual([]);
  });

  it("maps the published article and falls back to a body image as lead", () => {
    expect(articleFromNews(fixture, "en")).toMatchObject({
      summary: "A short summary", author: { name: "Ada Lovelace", role: "author", bio: "Writer", initials: "AL" },
      topics: [{ id: "climate", slug: "climate", label: "Climate" }], updates: [{ text: "A correction." }],
      caption: "River", credit: "Photo desk", readingMinutes: 2,
    });
    const noLead = publicNewsSchema.parse({ ...fixture, leadImage: null, body: { type: "doc", content: [{ type: "image", attrs: { mediaAssetId: mediaId, alt: "Inline" } }] } });
    expect(articleFromNews(noLead, "en")?.story.image.src).toBe("/card");
    // An imported article with no picture is still an article; it has no hero image (ADR-051).
    const noPicture = articleFromNews(publicNewsSchema.parse({ ...fixture, leadImage: null, media: [] }), "en");
    expect(noPicture?.story.title).toBe("Sample story");
    expect(noPicture?.story.image).toBeUndefined();
  });

  it("uses the API reading time, including a one minute value", () => {
    expect(articleFromNews(fixture, "en")?.readingMinutes).toBe(2);
    const oneMinute = publicNewsSchema.parse({ ...fixture, readingMinutes: 1 });
    expect(articleFromNews(oneMinute, "en")?.readingMinutes).toBe(1);
  });

  it("requests details without following 301 or 308 redirects", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const fetchMock = vi.fn().mockResolvedValue({ status: 301, ok: false, headers: new Headers({ location: "/public/news/en/new-slug-abc123" }) } as Response);
    vi.stubGlobal("fetch", fetchMock);
    await expect(articleFromApi("old-slug-abc123", "en")).resolves.toEqual({ redirectTo: "new-slug-abc123" });
    expect(fetchMock.mock.calls[0]![1].redirect).toBe("manual");
  });
});
