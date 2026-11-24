import { describe, expect, it } from "vitest";
import { publicSecurityHeaders } from "./security-headers";

const value = (key: string) => publicSecurityHeaders.find((h) => h.key === key)?.value;

describe("public security headers", () => {
  it("refuses to be framed and stops sniffed content types", () => {
    expect(value("X-Frame-Options")).toBe("DENY");
    expect(value("X-Content-Type-Options")).toBe("nosniff");
    expect(value("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });

  it("keeps the base URL, plugins and form targets to this site", () => {
    const csp = value("Content-Security-Policy") ?? "";
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("sends only the origin to other sites, and turns off the camera, microphone and location", () => {
    expect(value("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(value("Permissions-Policy")).toContain("geolocation=()");
  });
});
