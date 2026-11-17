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
    return proxy(request("/x")).then((response) => {
      expect(response.headers.get("x-middleware-rewrite")).toContain("/bn/x");
    });
  });

  it("redirects a remembered English choice at / only, private and not stored", () => {
    return Promise.all([proxy(request("/", "fl-lang=en")), proxy(request("/x", "fl-lang=en"))]).then(([home, other]) => {
      expect(home.status).toBe(307);
      expect(home.headers.get("location")).toContain("/en");
      expect(home.headers.get("cache-control")).toBe("private, no-store");
      expect(other.headers.get("x-middleware-rewrite")).toContain("/bn/x");
    });
  });

  it("ignores Accept-Language", () => {
    const req = new NextRequest("http://localhost:3000/", {
      headers: { "accept-language": "en-US,en;q=0.9" },
    });
    return proxy(req).then((response) => expect(response.headers.get("x-middleware-rewrite")).toContain("/bn"));
  });

  it("keeps the ?lang= choice in a cookie and sends no-store", () => {
    return proxy(request("/?lang=en")).then((response) => {
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toContain("fl-lang=en");
      expect(response.headers.get("set-cookie")).not.toContain("Secure");
    });
  });

  it("marks the cookie Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    return proxy(request("/?lang=en")).then((response) => expect(response.headers.get("set-cookie")).toContain("Secure"));
  });

  it("sets no cookie for an unknown language", () => {
    return proxy(request("/?lang=fr")).then((response) => expect(response.headers.get("set-cookie")).toBeNull());
  });

  it("leaves files from public/ alone", () => {
    return proxy(request("/mock/a.jpg", "fl-lang=en")).then((response) => {
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(response.headers.get("location")).toBeNull();
    });
  });

  it("serves a localized 503 for documents when the configured API is down", async () => {
    vi.stubEnv("FACTLENS_API_URL", "https://api.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    vi.resetModules();
    const { proxy: apiProxy } = await import("./proxy");
    for (const [path, title] of [["/", "এই মুহূর্তে খবর পাওয়া যাচ্ছে না"], ["/en", "News is not available right now"]]) {
      const req = new NextRequest(`http://localhost:3000${path}`, { headers: { accept: "text/html" } });
      const response = await apiProxy(req);
      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("30");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.text()).toContain(`<h1>${title}</h1>`);
    }
  });

  it("skips health checks in mock mode and for JSON requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FACTLENS_API_URL", "");
    vi.resetModules();
    const { proxy: mockProxy } = await import("./proxy");
    await mockProxy(new NextRequest("http://localhost:3000/", { headers: { accept: "text/html" } }));
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("FACTLENS_API_URL", "https://api.test");
    vi.resetModules();
    const { proxy: apiProxy } = await import("./proxy");
    const response = await apiProxy(new NextRequest("http://localhost:3000/", { headers: { accept: "application/json" } }));
    expect(response.status).not.toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("runs on every path except api/, _next/ and public media", () => {
    expect(config.matcher).toEqual(["/((?!api/|_next/|public/media/).*)"]);
  });
});
