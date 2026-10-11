import { describe, expect, it } from "vitest";

import {
  cubicBezier,
  nextTabIndex,
  parseCubicBezier,
  sliderEdges,
  sliderTarget,
} from "./slider";

describe("sliderEdges", () => {
  it("is at the start at 0 and at the end at the last position", () => {
    expect(sliderEdges(0, 652)).toEqual({ atStart: true, atEnd: false });
    expect(sliderEdges(326, 652)).toEqual({ atStart: false, atEnd: false });
    expect(sliderEdges(652, 652)).toEqual({ atStart: false, atEnd: true });
  });

  it("allows sub-pixel positions", () => {
    expect(sliderEdges(0.5, 652).atStart).toBe(true);
    expect(sliderEdges(651.5, 652).atEnd).toBe(true);
  });

  it("is at both ends when the row does not scroll", () => {
    expect(sliderEdges(0, 0)).toEqual({ atStart: true, atEnd: true });
  });
});

describe("sliderTarget", () => {
  it("moves one column (width + gap) in each direction", () => {
    expect(sliderTarget(0, 326, 652, 1)).toBe(326);
    expect(sliderTarget(326, 326, 652, 1)).toBe(652);
    expect(sliderTarget(652, 326, 652, -1)).toBe(326);
  });

  it("does not loop at either end (7.4)", () => {
    expect(sliderTarget(0, 326, 652, -1)).toBe(0);
    expect(sliderTarget(652, 326, 652, 1)).toBe(652);
  });

  it("moves from the nearest column after a swipe", () => {
    expect(sliderTarget(300, 326, 652, 1)).toBe(652);
    expect(sliderTarget(40, 326, 652, 1)).toBe(326);
  });

  it("stops at the last position when it is not a full column away", () => {
    expect(sliderTarget(326, 326, 500, 1)).toBe(500);
  });

  it("stays put with no step", () => {
    expect(sliderTarget(10, 0, 652, 1)).toBe(10);
  });
});

describe("nextTabIndex", () => {
  it("moves with the arrow keys and wraps", () => {
    expect(nextTabIndex(0, "ArrowRight", 6)).toBe(1);
    expect(nextTabIndex(5, "ArrowRight", 6)).toBe(0);
    expect(nextTabIndex(0, "ArrowLeft", 6)).toBe(5);
  });

  it("goes to the first and last tab with Home and End", () => {
    expect(nextTabIndex(3, "Home", 6)).toBe(0);
    expect(nextTabIndex(3, "End", 6)).toBe(5);
  });

  it("ignores other keys", () => {
    expect(nextTabIndex(2, "Enter", 6)).toBeNull();
    expect(nextTabIndex(2, "ArrowDown", 6)).toBeNull();
    expect(nextTabIndex(0, "ArrowRight", 0)).toBeNull();
  });
});

describe("cubicBezier", () => {
  const ease = cubicBezier(0.22, 1, 0.36, 1);

  it("starts at 0, ends at 1 and runs fast at first (ease-slide)", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.25)).toBeGreaterThan(0.6);
  });

  it("only goes forward", () => {
    let last = 0;
    for (let t = 0.05; t <= 1; t += 0.05) {
      const value = ease(t);
      expect(value).toBeGreaterThanOrEqual(last);
      last = value;
    }
  });

  it("is a straight line for a linear curve", () => {
    expect(cubicBezier(0, 0, 1, 1)(0.5)).toBeCloseTo(0.5, 3);
  });
});

describe("parseCubicBezier", () => {
  it("reads the four numbers of a CSS value", () => {
    expect(parseCubicBezier(" cubic-bezier(0.22, 1, 0.36, 1)")).toEqual([
      0.22, 1, 0.36, 1,
    ]);
  });

  it("returns null for anything else", () => {
    expect(parseCubicBezier("ease-out")).toBeNull();
    expect(parseCubicBezier("cubic-bezier(1, 2, 3)")).toBeNull();
  });
});
