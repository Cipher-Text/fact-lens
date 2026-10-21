import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config, proxy } from "./proxy";

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });

afterEach(() => vi.unstubAllEnvs());

describe("proxy (DR-17, DR-270, DR-328)", () => {
  it("rewrites a path without a prefix to bn", () => {
    const response = proxy(request("/x"));
    expect(response.headers.get("x-middleware-rewrite")).toContain("/bn/x");
  });

  it("redirects a remembered English choice at / only, private and not stored", () => {
    const home = proxy(request("/", "fl-lang=en"));
    expect(home.status).toBe(307);
    expect(home.headers.get("location")).toContain("/en");
    expect(home.headers.get("cache-control")).toBe("private, no-store");

    const other = proxy(request("/x", "fl-lang=en"));
    expect(other.headers.get("x-middleware-rewrite")).toContain("/bn/x");
  });

  it("ignores Accept-Language", () => {
    const req = new NextRequest("http://localhost:3000/", {
      headers: { "accept-language": "en-US,en;q=0.9" },
    });
    expect(proxy(req).headers.get("x-middleware-rewrite")).toContain("/bn");
  });

  it("keeps the ?lang= choice in a cookie and sends no-store", () => {
    const response = proxy(request("/?lang=en"));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain("fl-lang=en");
    expect(response.headers.get("set-cookie")).not.toContain("Secure");
  });

  it("marks the cookie Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = proxy(request("/?lang=en"));
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("sets no cookie for an unknown language", () => {
    const response = proxy(request("/?lang=fr"));
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("leaves files from public/ alone", () => {
    const response = proxy(request("/mock/a.jpg", "fl-lang=en"));
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
  });

  it("runs on every path except api/ and _next/", () => {
    expect(config.matcher).toEqual(["/((?!api/|_next/).*)"]);
  });
});
