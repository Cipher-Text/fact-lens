import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const ID = "6f1c8f0e-3c1b-4c1e-9a62-0f7d3b7c1a11";
const TOKEN = "b".repeat(43);
const ctx = { params: Promise.resolve({ id: ID }) };

const request = (init: { body?: unknown; headers?: Record<string, string>; raw?: string } = {}) =>
  new NextRequest(`http://localhost:3000/api/poll/${ID}/vote`, {
    method: "POST",
    headers: { host: "localhost:3000", "content-type": "application/json", ...init.headers },
    body: init.raw ?? JSON.stringify(init.body ?? { optionId: "o1", lang: "bn" }),
  });

const upstream = (status = 200, body: unknown = { myVote: "o1", options: [] }, cookies: string[] = []) => {
  const headers = new Headers({ "content-type": "application/json" });
  const res = new Response(JSON.stringify(body), { status, headers });
  (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie = () => cookies;
  return vi.fn().mockResolvedValue(res);
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/poll/:id/vote", () => {
  it("is off without FACTLENS_API_URL", async () => {
    vi.stubEnv("FACTLENS_API_URL", "");
    expect((await POST(request(), ctx)).status).toBe(404);
  });

  it("passes the vote to the API with the voter cookie, the reader's address and the API language", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const f = upstream(200, { myVote: "o1", options: [] }, [`fl_voter=${TOKEN}; Path=/; HttpOnly; SameSite=Lax`]);
    vi.stubGlobal("fetch", f);
    const res = await POST(
      request({ headers: { cookie: `other=1; fl_voter=${TOKEN}`, "x-forwarded-for": "203.0.113.7, 10.0.0.1" } }),
      ctx,
    );
    expect(res.status).toBe(200);
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe(`http://api.test/public/polls/${ID}/vote`);
    expect(init.headers).toMatchObject({ cookie: `fl_voter=${TOKEN}`, "x-forwarded-for": "203.0.113.7" });
    expect(JSON.parse(init.body)).toEqual({ optionId: "o1", locale: "bn-BD" });
    expect(res.headers.get("set-cookie")).toContain("fl_voter=");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("forwards no other cookies, and relays the API's refusals", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const f = upstream(429, { error: { message: "Too many" } });
    vi.stubGlobal("fetch", f);
    const res = await POST(request({ headers: { cookie: "session=secret; fl_voter=short" } }), ctx);
    expect(res.status).toBe(429);
    expect(f.mock.calls[0]![1].headers.cookie).toBeUndefined();
  });

  it("refuses a request from another site, a bad id, and a malformed body", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const f = upstream();
    vi.stubGlobal("fetch", f);
    expect((await POST(request({ headers: { origin: "https://evil.example" } }), ctx)).status).toBe(403);
    expect((await POST(request(), { params: Promise.resolve({ id: "not-a-uuid" }) })).status).toBe(404);
    expect((await POST(request({ raw: "{nope" }), ctx)).status).toBe(400);
    expect((await POST(request({ body: { optionId: 1, lang: "bn" } }), ctx)).status).toBe(400);
    expect((await POST(request({ body: { optionId: "o1", lang: "fr" } }), ctx)).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("says so when the API cannot be reached", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect((await POST(request(), ctx)).status).toBe(502);
  });
});
