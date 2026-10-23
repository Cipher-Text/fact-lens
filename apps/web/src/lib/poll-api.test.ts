import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchFeaturedPoll, toPoll } from "./poll-api";

const TOKEN = "a".repeat(43);
const api = {
  id: "p1",
  question: "Q?",
  open: true,
  myVote: "o2",
  options: [
    { id: "o1", label: "One", votes: 3 },
    { id: "o2", label: "Two", votes: 4 },
  ],
};
const ok = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as unknown as typeof fetch;

afterEach(() => vi.unstubAllEnvs());

describe("toPoll", () => {
  it("reads an API poll with its own vote", () => {
    expect(toPoll(api, "en")).toEqual({
      id: "p1",
      lang: "en",
      question: "Q?",
      options: api.options,
      live: { open: true, myVote: "o2" },
    });
  });
  it("drops a vote for an option that is not there, and refuses anything unusable", () => {
    expect(toPoll({ ...api, myVote: "zzz" }, "en")?.live?.myVote).toBeNull();
    expect(toPoll({ ...api, options: [api.options[0]] }, "en")).toBeNull();
    expect(toPoll({ ...api, options: [api.options[0], { id: "x", label: 1, votes: 1 }] }, "en")).toBeNull();
    expect(toPoll({ ...api, options: [api.options[0], { id: "x", label: "X", votes: -1 }] }, "en")).toBeNull();
    expect(toPoll({ ...api, open: "yes" }, "en")).toBeNull();
    expect(toPoll(null, "en")).toBeNull();
  });
});

describe("fetchFeaturedPoll", () => {
  it("is off without FACTLENS_API_URL and does not call the network", async () => {
    vi.stubEnv("FACTLENS_API_URL", "");
    const f = ok(api);
    expect(await fetchFeaturedPoll("en", TOKEN, f)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it("asks for the API language code and forwards only a well-formed voter cookie", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test/");
    const f = ok(api);
    expect((await fetchFeaturedPoll("bn", TOKEN, f))?.live?.open).toBe(true);
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe("http://api.test/public/polls/featured/bn-BD");
    expect(init.headers).toEqual({ cookie: `fl_voter=${TOKEN}` });
    expect(init.cache).toBe("no-store");

    const g = ok(api);
    await fetchFeaturedPoll("en", "bad token; other=1", g);
    expect((g as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![1].headers).toBeUndefined();
  });
  it("returns null when there is no featured poll, on a network failure, and on bad data", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    expect(await fetchFeaturedPoll("en", null, ok({}, 404))).toBeNull();
    expect(await fetchFeaturedPoll("en", null, vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch)).toBeNull();
    expect(await fetchFeaturedPoll("en", null, ok({ nope: 1 }))).toBeNull();
  });
});
