import { afterEach, describe, expect, it, vi } from "vitest";
import { searchFromApi, trendingFromApi } from "./search";

const item = {
  id: "22222222-2222-4222-8222-000000000001",
  shortId: "story1",
  format: "news",
  slug: "story-1",
  title: "Search result",
  dek: null,
  publishedAt: "2026-01-01T00:00:00.000Z",
  readingMinutes: 2,
  category: { key: "geopolitics", name: "Geopolitics", slug: "geopolitics" },
  image: null,
};

function installFetch(responder: (url: URL) => Response) {
  vi.stubEnv("FACTLENS_API_URL", "https://api.example");
  const fetch = vi.fn(async (input: RequestInfo | URL) => responder(new URL(String(input))));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("public search adapters", () => {
  it("uses encoded query, API locale, limit and cursor, and maps stories", async () => {
    const fetch = installFetch(() => new Response(JSON.stringify({ query: "ঢাকা খবর", items: [item], nextCursor: "next + token" }), { status: 200 }));
    const result = await searchFromApi("ঢাকা খবর", "bn", "next + token");
    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/public/search/bn-BD");
    expect(url.searchParams.get("q")).toBe("ঢাকা খবর");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("cursor")).toBe("next + token");
    expect(result.stories.map(({ id, title }) => ({ id, title }))).toEqual([{ id: "story1", title: "Search result" }]);
    expect(result.nextCursor).toBe("next + token");
  });

  it("returns trending terms and maps English locale", async () => {
    const fetch = installFetch((url) => {
      expect(url.pathname).toBe("/public/trending-searches/en");
      return new Response(JSON.stringify({ terms: ["climate"] }), { status: 200 });
    });
    await expect(trendingFromApi("en")).resolves.toEqual(["climate"]);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it.each([404, 503])("returns no trending terms on HTTP %i", async (status) => {
    installFetch(() => new Response("{}", { status }));
    await expect(trendingFromApi("en")).resolves.toEqual([]);
  });

  it("rejects a malformed search response", async () => {
    installFetch(() => new Response(JSON.stringify({ items: "invalid" }), { status: 200 }));
    await expect(searchFromApi("news", "en")).rejects.toThrow();
  });
});
