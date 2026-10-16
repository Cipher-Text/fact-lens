"use client";

import { useLayoutEffect } from "react";

const PROPERTY = "--scroll-offset";
const GAP_PX = 16;

/**
 * Keeps `--scroll-offset` (the `scroll-padding-top` on <html>) at the rendered height of
 * the top bar plus 16px, so an anchor stops below the sticky bar. At 200% text the bar
 * wraps to two lines, so the offset follows the real bar, not `--bar-height` (DR-265).
 * Renders nothing. Put it inside the bar. The bar is in every page, so the property is left
 * set when the observer stops; removing it on cleanup made a #hash scroll on load jump back
 * to the top in development.
 */
export function ScrollOffset() {
  useLayoutEffect(() => {
    const bar = document.querySelector<HTMLElement>("[data-top-bar]");
    if (!bar) return;
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty(PROPERTY, `${bar.offsetHeight + GAP_PX}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
