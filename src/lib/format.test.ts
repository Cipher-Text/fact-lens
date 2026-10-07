import { describe, expect, it } from "vitest";

import { formatDate, formatNumber } from "./format";

describe("formatting for the page language (TYP-17)", () => {
  it("uses Bangla digits on Bangla pages", () => {
    expect(formatNumber(1234567.5, "bn")).toBe("১২,৩৪,৫৬৭.৫");
    expect(formatNumber(1234567.5, "en")).toBe("1,234,567.5");
  });

  it("formats dates in Dhaka time", () => {
    // 23:30 UTC on 6 October is 05:30 on 7 October in Dhaka.
    const date = new Date("2026-10-06T23:30:00Z");
    expect(formatDate(date, "bn")).toBe("৭ অক্টোবর, ২০২৬");
    expect(formatDate(date, "en")).toBe("7 October 2026");
  });
});
