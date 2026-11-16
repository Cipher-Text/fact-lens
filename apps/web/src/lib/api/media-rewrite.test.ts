import { describe, expect, it } from "vitest";
import { config } from "@/proxy";
import { mediaRewrites } from "./media-rewrite";

describe("mediaRewrites", () => {
  it("returns no rules without an API base", () => {
    expect(mediaRewrites(null)).toEqual([]);
  });

  it("rewrites public media before route files and removes a trailing slash", () => {
    expect(mediaRewrites("https://api.example.test/")).toEqual({
      beforeFiles: [
        {
          source: "/public/media/:path*",
          destination: "https://api.example.test/public/media/:path*",
        },
      ],
    });
  });
});

describe("proxy matcher", () => {
  it("excludes public media while still matching localized pages", () => {
    const matcher = config.matcher[0];
    const matches = (pathname: string) => new RegExp(`^${matcher}$`).test(pathname);

    expect(matches("/public/media/abc123/card")).toBe(false);
    expect(matches("/en/category/economy")).toBe(true);
  });
});
