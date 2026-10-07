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

/** Ease-out cubic for the 250ms button scroll. */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
