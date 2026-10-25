import { afterEach, describe, expect, it, vi } from "vitest";

import { getApiNavItems } from "@/components/header/navItems";
import { en } from "@/i18n/en";

import { fetchNavigation, parseNavigation } from "./navigation";

const menu = [
  { key: "world", name: "World", slug: "world", children: [{ key: "asia", name: "Asia", slug: "asia" }] },
  { key: "local", name: "Local", slug: "local", children: [] },
];
const reply = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch;

afterEach(() => vi.unstubAllEnvs());

describe("fetchNavigation", () => {
  it("is off without FACTLENS_API_URL and does not call the network", async () => {
    vi.stubEnv("FACTLENS_API_URL", "");
    const f = reply(menu);
    expect(await fetchNavigation("en", f)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("asks for the API language code of the site language", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test/");
    const f = reply(menu);
    expect(await fetchNavigation("bn", f)).toEqual(menu);
    expect((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toBe("http://api.test/public/navigation/bn-BD");
  });

  it("returns null on an error status, a network failure, bad data or an empty menu", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    expect(await fetchNavigation("en", reply(menu, false))).toBeNull();
    expect(await fetchNavigation("en", vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch)).toBeNull();
    expect(await fetchNavigation("en", reply({ nope: true }))).toBeNull();
    expect(await fetchNavigation("en", reply([]))).toBeNull();
  });
});

describe("parseNavigation", () => {
  it("drops malformed entries and defaults missing children", () => {
    expect(parseNavigation([{ key: "a", name: "A", slug: "a" }, { key: 1 }, "x"])).toEqual([{ key: "a", name: "A", slug: "a", children: [] }]);
  });
});

describe("getApiNavItems", () => {
  it("puts Home first, then parents with their child menus", () => {
    const items = getApiNavItems(menu, en, "en", "/");
    expect(items.map((i) => i.id)).toEqual(["home", "world", "local"]);
    expect(items[0]!.current).toBe(true);
    expect(items[1]!.children?.map((c) => c.label)).toEqual(["Asia"]);
    expect(items[2]!.children).toBeUndefined();
  });

  it("links to the homepage sections by hash on the homepage", () => {
    const items = getApiNavItems(menu, en, "en", "/");
    expect(items[1]!.href).toBe("#category-world");
    expect(items[1]!.children?.[0]!.href).toBe("#category-asia");
  });

  it("links back to the homepage sections from other pages", () => {
    const items = getApiNavItems(menu, en, "en", "/story/river-data-framework");
    expect(items[0]!.current).toBe(false);
    expect(items[1]!.href).toBe("/en#category-world");
    expect(items[1]!.children?.[0]!.href).toBe("/en#category-asia");
    expect(items[2]!.href).toBe("/en#category-local");
  });
});
