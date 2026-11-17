import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ViewBeacon } from "./ViewBeacon";

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("ViewBeacon", () => {
  it("posts once per mount with the story and reader details", () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", fetcher);
    render(<ViewBeacon shortId="abc123" locale="en" />);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, init] = fetcher.mock.calls[0]!;
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body)).toMatchObject({ shortId: "abc123", locale: "en", referrer: "" });
    expect(JSON.parse(init.body).sessionId).toMatch(/^[a-f0-9]{32}$/);
  });

  it("does not send a request when the API is unset", () => {
    vi.stubEnv("FACTLENS_API_URL", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    // In API-off mode the article page does not render this component.
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reuses the session id stored for this browser session", () => {
    sessionStorage.setItem("fl-session", "z".repeat(32));
    const fetcher = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", fetcher);
    render(<ViewBeacon shortId="abc123" locale="bn" />);
    expect(JSON.parse(fetcher.mock.calls[0]![1].body)).toMatchObject({ locale: "bn-BD", sessionId: "z".repeat(32) });
  });
});
