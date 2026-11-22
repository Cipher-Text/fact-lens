import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const payload = { shortId: "abc123", locale: "en", sessionId: "a".repeat(32), referrer: "https://news.example/path?q=1" };
const request = (body: unknown = payload, headers: Record<string, string> = {}) => new NextRequest("http://localhost:3000/api/views", {
  method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
});

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("POST /api/views", () => {
  it("forwards a valid beacon, the client address, and only the referrer domain", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test/");
    vi.stubEnv("SITE_TRUST_PROXY", "true");
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetcher);
    // The proxy appends the reader's address last; the reader's own entry before it is ignored.
    const response = await POST(request(payload, { "x-forwarded-for": "192.0.2.66, 203.0.113.8" }));
    expect(response.status).toBe(204);
    expect(fetcher).toHaveBeenCalledWith("http://api.test/public/views", expect.objectContaining({
      method: "POST", cache: "no-store",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.8" },
      body: JSON.stringify({ ...payload, referrer: "news.example" }),
    }));
  });

  it("passes no address when the site is not behind a proxy, whatever the reader sends", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetcher);
    await POST(request(payload, { "x-forwarded-for": "203.0.113.8", "x-real-ip": "203.0.113.9" }));
    expect(fetcher.mock.calls[0]![1].headers).toEqual({ "content-type": "application/json" });
  });

  it("answers 204 when the API is down", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(204);
  });

  it("answers 204 when the API is unset", async () => {
    vi.stubEnv("FACTLENS_API_URL", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect((await POST(request())).status).toBe(204);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("answers 400 for a body that fails the schema", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect((await POST(request({ ...payload, sessionId: "bad" }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
