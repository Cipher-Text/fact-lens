import { describe, expect, it } from "vitest";

import { fill, formatDate, formatNumber, formatPercent } from "./format";

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

describe("fill", () => {
  it("replaces known placeholders and keeps unknown ones", () => {
    expect(fill("{minutes} min read", { minutes: "6" })).toBe("6 min read");
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});

describe("formatPercent", () => {
  it("uses the page language digits (TYP-17)", () => {
    expect(formatPercent(38, "bn")).toBe("৩৮%");
    expect(formatPercent(38, "en")).toBe("38%");
    expect(formatPercent(100, "bn")).toBe("১০০%");
  });
});
