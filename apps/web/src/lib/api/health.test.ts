import { describe, expect, it, vi } from "vitest";

import { createApiHealth } from "./health";

describe("createApiHealth", () => {
  it("caches up results for the TTL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const health = createApiHealth({ base: "https://api.test", fetchImpl, ttlMs: 100 });
    expect(await health.isUp()).toBe(true);
    expect(await health.isUp()).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("treats a network error, timeout, and non-2xx as down", async () => {
    const network = createApiHealth({ base: "https://api.test", fetchImpl: vi.fn().mockRejectedValue(new Error()) });
    const timeout = createApiHealth({
      base: "https://api.test",
      fetchImpl: vi.fn(() => new Promise<Response>(() => {})),
      timeoutMs: 1,
    });
    const failedStatus = createApiHealth({
      base: "https://api.test",
      fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    });
    await expect(network.isUp()).resolves.toBe(false);
    await expect(timeout.isUp()).resolves.toBe(false);
    await expect(failedStatus.isUp()).resolves.toBe(false);
  });

  it("shares concurrent checks and checks again after the TTL", async () => {
    let time = 0;
    let resolve!: (response: Response) => void;
    const fetchImpl = vi.fn(() => new Promise<Response>((done) => { resolve = done; }));
    const health = createApiHealth({ base: "https://api.test", fetchImpl, now: () => time, ttlMs: 10 });
    const first = health.isUp();
    const concurrent = health.isUp();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    resolve(new Response(null, { status: 200 }));
    await expect(Promise.all([first, concurrent])).resolves.toEqual([true, true]);
    time = 11;
    const next = health.isUp();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    resolve(new Response(null, { status: 200 }));
    await expect(next).resolves.toBe(true);
  });
});
