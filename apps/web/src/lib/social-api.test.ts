import { afterEach, describe, expect, it, vi } from "vitest";

import { socialLinks } from "@/components/footer/socialLinks";

import { fetchSocialLinks, mergeSocialLinks } from "./social-api";

const ok = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as unknown as typeof fetch;

afterEach(() => vi.unstubAllEnvs());

describe("mergeSocialLinks", () => {
  it("replaces only the networks the newsroom set, keeping order and the defaults for the rest", () => {
    const merged = mergeSocialLinks({ links: [{ network: "youtube", url: "https://www.youtube.com/@factlens" }, { network: "facebook", url: "https://www.facebook.com/factlens" }] });
    expect(merged.map((l) => l.network)).toEqual(socialLinks.map((l) => l.network));
    expect(merged.find((l) => l.network === "youtube")!.href).toBe("https://www.youtube.com/@factlens");
    expect(merged.find((l) => l.network === "facebook")!.href).toBe("https://www.facebook.com/factlens");
    expect(merged.find((l) => l.network === "x")!.href).toBe(socialLinks.find((l) => l.network === "x")!.href);
  });
  it("ignores anything that is not an https address for a known network", () => {
    const merged = mergeSocialLinks({ links: [{ network: "x", url: "javascript:alert(1)" }, { network: "x", url: "http://x.com/a" }, { network: "tiktok", url: "https://tiktok.com/a" }, null, { network: 1 }] });
    expect(merged).toEqual(socialLinks);
    expect(mergeSocialLinks(null)).toEqual(socialLinks);
    expect(mergeSocialLinks({ links: "no" })).toEqual(socialLinks);
  });
});

describe("fetchSocialLinks", () => {
  it("is off without FACTLENS_API_URL and does not call the network", async () => {
    vi.stubEnv("FACTLENS_API_URL", "");
    const f = ok({ links: [] });
    expect(await fetchSocialLinks(f)).toEqual(socialLinks);
    expect(f).not.toHaveBeenCalled();
  });
  it("reads the saved addresses, and falls back on any failure", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test/");
    const f = ok({ links: [{ network: "instagram", url: "https://www.instagram.com/factlens" }] });
    expect((await fetchSocialLinks(f)).find((l) => l.network === "instagram")!.href).toBe("https://www.instagram.com/factlens");
    expect((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toBe("http://api.test/public/site/social-links");
    expect(await fetchSocialLinks(ok({}, 500))).toEqual(socialLinks);
    expect(await fetchSocialLinks(vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch)).toEqual(socialLinks);
  });
});
