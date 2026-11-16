import { afterEach, describe, expect, it, vi } from "vitest";
import { navigationSchema } from "@fact-lens/contracts";

import { apiBase, apiGet, ApiBadResponse, ApiNotFound, ApiUnavailable } from "./client";

const schema = navigationSchema;
const response = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("public API client", () => {
  it("trims the configured base and parses successful responses", async () => {
    vi.stubEnv("FACTLENS_API_URL", " http://api.test/// ");
    const fetchMock = vi.fn().mockResolvedValue(response([]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGet("/public/example", schema)).resolves.toEqual([]);
    expect(fetchMock.mock.calls[0]![0]).toBe("http://api.test/public/example");
    expect(fetchMock.mock.calls[0]![1].headers).toEqual({ accept: "application/json" });
  });

  it("maps a 404 to ApiNotFound", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 404)));
    await expect(apiGet("/missing", schema)).rejects.toBeInstanceOf(ApiNotFound);
  });

  it("maps server and network failures to ApiUnavailable", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 500)));
    await expect(apiGet("/failed", schema)).rejects.toBeInstanceOf(ApiUnavailable);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(apiGet("/failed", schema)).rejects.toBeInstanceOf(ApiUnavailable);
  });

  it("maps timeouts to ApiUnavailable", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    const fetchMock = vi.fn((_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("Timed out", "TimeoutError")));
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiGet("/slow", schema)).rejects.toBeInstanceOf(ApiUnavailable);
  });

  it("maps schema mismatches to ApiBadResponse", async () => {
    vi.stubEnv("FACTLENS_API_URL", "http://api.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ value: 1 })));
    await expect(apiGet("/bad", schema)).rejects.toBeInstanceOf(ApiBadResponse);
  });

  it("returns null when the base is unset", () => {
    vi.stubEnv("FACTLENS_API_URL", "   ");
    expect(apiBase()).toBeNull();
  });
});
