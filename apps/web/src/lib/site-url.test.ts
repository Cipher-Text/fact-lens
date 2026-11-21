import { afterEach, describe, expect, it, vi } from "vitest";
import { siteOrigin, siteUrl } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("site URL", () => {
  it("returns null for a blank value", () => {
    vi.stubEnv("PUBLIC_SITE_URL", "  ");
    expect(siteUrl()).toBeNull();
  });

  it("rejects invalid and non-http URLs", () => {
    vi.stubEnv("PUBLIC_SITE_URL", "ftp://example.org");
    expect(siteUrl()).toBeNull();
    vi.stubEnv("PUBLIC_SITE_URL", "not a URL");
    expect(siteUrl()).toBeNull();
  });

  it("trims whitespace and trailing slashes", () => {
    vi.stubEnv("PUBLIC_SITE_URL", " https://example.org/// ");
    expect(siteUrl()).toBe("https://example.org");
  });

  it("uses localhost in development and no fallback in production", () => {
    vi.stubEnv("PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(siteOrigin()).toBe("http://localhost:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(siteOrigin()).toBeNull();
  });
});
