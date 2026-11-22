import { describe, expect, it } from "vitest";

import { clientAddressHeaders, siteClientAddress } from "./client-address";

const headers = (init: Record<string, string>) => new Headers(init);

describe("siteClientAddress", () => {
  it("is null when the site is not behind a proxy, whatever headers the reader sends", () => {
    expect(siteClientAddress(headers({ "x-forwarded-for": "203.0.113.7" }), false)).toBeNull();
    expect(siteClientAddress(headers({ "x-real-ip": "203.0.113.7" }), false)).toBeNull();
  });

  it("takes the last X-Forwarded-For entry, the one the proxy appended", () => {
    expect(siteClientAddress(headers({ "x-forwarded-for": "192.0.2.66, 203.0.113.7" }), true)).toBe("203.0.113.7");
    expect(siteClientAddress(headers({ "x-forwarded-for": "2001:db8::1" }), true)).toBe("2001:db8::1");
  });

  it("falls back to X-Real-IP when there is no X-Forwarded-For", () => {
    expect(siteClientAddress(headers({ "x-real-ip": " 203.0.113.9 " }), true)).toBe("203.0.113.9");
  });

  it("is null when the value is not an address", () => {
    expect(siteClientAddress(headers({ "x-forwarded-for": "not-an-address<script>" }), true)).toBeNull();
    expect(siteClientAddress(headers({}), true)).toBeNull();
  });

  it("reads SITE_TRUST_PROXY from the environment by default", () => {
    const before = process.env.SITE_TRUST_PROXY;
    try {
      process.env.SITE_TRUST_PROXY = "true";
      expect(siteClientAddress(headers({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
      process.env.SITE_TRUST_PROXY = "false";
      expect(siteClientAddress(headers({ "x-forwarded-for": "203.0.113.7" }))).toBeNull();
    } finally {
      if (before === undefined) delete process.env.SITE_TRUST_PROXY;
      else process.env.SITE_TRUST_PROXY = before;
    }
  });
});

describe("clientAddressHeaders", () => {
  it("sends only the site's own value, and nothing when there is none", () => {
    expect(clientAddressHeaders("203.0.113.7")).toEqual({ "x-forwarded-for": "203.0.113.7" });
    expect(clientAddressHeaders(null)).toEqual({});
  });
});
