import { afterEach, describe, expect, it, vi } from "vitest";
import { readNextFromApi } from "./related";

const listItem = (overrides: Record<string, unknown> = {}) => ({
  id: "00000000-0000-4000-8000-000000000001",
  shortId: "abc123",
  slug: "news-story",
  format: "news",
  title: "API story",
  dek: null,
  publishedAt: "2026-11-17T12:00:00.000Z",
  readingMinutes: 4,
  category: { key: "geopolitics", name: "Geopolitics", slug: "geopolitics" },
  image: null,
  ...overrides,
});

const response = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("readNextFromApi", () => {
  it("maps API items and drops items the story adapter cannot map", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      items: [listItem(), listItem({ id: "00000000-0000-4000-8000-000000000002", shortId: "bad123", category: { key: "unknown", name: "Unknown", slug: "unknown" } })],
    })));

    await expect(readNextFromApi("news-story-abc123", "en")).resolves.toEqual([{
      story: expect.objectContaining({ id: "abc123", title: "API story", readingMinutes: 4, category: "geopolitics" }),
    }]);
  });

  it("returns an empty list on 404 without warning", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 404)));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(readNextFromApi("missing", "bn")).resolves.toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ["503", response({}, 503)],
    ["malformed body", response({ wrong: [] })],
  ])("returns an empty list and warns on %s", async (_label, body) => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(body));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(readNextFromApi("missing", "en")).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("requests the locale and URL-encoded reference", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const fetchMock = vi.fn().mockResolvedValue(response({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await readNextFromApi("story name/বাংলা", "bn");
    expect(fetchMock.mock.calls[0]![0]).toBe("http://api.test/public/news/bn-BD/story%20name%2F%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE/related?limit=3");
  });
});
