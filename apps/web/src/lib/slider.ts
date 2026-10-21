// Pure helpers for the P-3b regions slider and tabs (spacing-layout-system.md 7.4).

/** Pixel tolerance for sub-pixel scroll positions. */
const EDGE = 1;

export type SliderEdges = { atStart: boolean; atEnd: boolean };

/** Whether the row is at its start or its end. A button is disabled at its end. */
export function sliderEdges(
  scrollLeft: number,
  maxScroll: number,
): SliderEdges {
  return {
    atStart: scrollLeft <= EDGE,
    atEnd: scrollLeft >= maxScroll - EDGE,
  };
}

/**
 * The scroll position one region away: the nearest column start, plus or minus one
 * step (column width + gap). Clamped to the row, so there is no loop.
 */
export function sliderTarget(
  scrollLeft: number,
  step: number,
  maxScroll: number,
  direction: -1 | 1,
): number {
  if (step <= 0) return scrollLeft;
  const index = Math.round(scrollLeft / step) + direction;
  return Math.min(Math.max(index * step, 0), Math.max(maxScroll, 0));
}

/**
 * The tab to select after a key press, or null for other keys. Arrow keys wrap
 * (WAI-ARIA tabs pattern); Home and End go to the first and the last tab.
 */
export function nextTabIndex(
  current: number,
  key: string,
  count: number,
): number | null {
  if (count <= 0) return null;
  switch (key) {
    case "ArrowRight":
      return (current + 1) % count;
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

/**
 * The easing of a slide: a CSS cubic-bezier(x1, y1, x2, y2) as a function of time (0 to 1).
 * Newton's method with a bisection fallback, the same curve the browser draws.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  const axis = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let low = 0;
    let high = 1;
    let s = x;
    for (let i = 0; i < 30; i++) {
      const value = axis(x1, x2, s);
      if (Math.abs(value - x) < 1e-5) break;
      if (value < x) low = s;
      else high = s;
      s = (low + high) / 2;
    }
    return axis(y1, y2, s);
  };
}

/** Reads the four numbers of `cubic-bezier(...)` from a CSS value, or null. */
export function parseCubicBezier(
  value: string,
): [number, number, number, number] | null {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  if (!match) return null;
  const numbers = match[1].split(",").map((part) => Number(part.trim()));
  return numbers.length === 4 && numbers.every(Number.isFinite)
    ? (numbers as [number, number, number, number])
    : null;
}

/** Reads a CSS time (`200ms`, `0.2s`) as milliseconds, or null. */
export function parseDuration(value: string): number | null {
  const match = /^\s*(\d*\.?\d+)(ms|s)\s*$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] === "s" ? amount * 1000 : amount;
}
