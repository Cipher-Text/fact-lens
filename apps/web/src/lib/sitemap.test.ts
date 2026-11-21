import { afterEach, describe, expect, it, vi } from "vitest";
import { sitemapEntries } from "./sitemap";

const item = (slug: string, shortId: string) => ({
  id: "00000000-0000-4000-8000-000000000001", shortId, format: "news", slug,
  title: "Story", dek: null, publishedAt: "2026-01-02T03:04:05.000Z", category: null,
  image: null, readingMinutes: 1,
});
const response = (items: unknown[], nextCursor: string | null = null) => ({
  ok: true, status: 200, json: async () => ({ filter: null, items, nextCursor }),
}) as Response;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sitemapEntries", () => {
  it("includes static pages in both languages and adds stories through pagination", async () => {
    vi.stubEnv("FACTLENS_API_URL", "https://api.example");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response([item("first", "abc123")], "next"))
      .mockResolvedValueOnce(response([item("second", "def456")]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]));
    vi.stubGlobal("fetch", fetchMock);

    const entries = await sitemapEntries("https://example.org");
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://example.org/");
    expect(urls).toContain("https://example.org/en");
    expect(urls).toContain("https://example.org/category/geopolitics");
    expect(urls).toContain("https://example.org/en/regions/china");
    expect(urls).toContain("https://example.org/story/first-abc123");
    expect(urls).toContain("https://example.org/story/second-def456");
    expect(entries.find((entry) => entry.url.endsWith("first-abc123"))?.lastModified).toEqual(new Date(item("first", "abc123").publishedAt));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1]![0])).toContain("cursor=next");
    expect(urls.every((url) => url.startsWith("https://example.org"))).toBe(true);
  });

  it("returns static pages when the API is unavailable", async () => {
    vi.stubEnv("FACTLENS_API_URL", "https://api.example");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const entries = await sitemapEntries("https://example.org");
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.url.startsWith("https://example.org"))).toBe(true);
    expect(entries.some((entry) => entry.url.includes("/story/"))).toBe(false);
  });
});
