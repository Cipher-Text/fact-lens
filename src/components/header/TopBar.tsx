import type { ReactNode } from "react";

type Props = {
  /** Menu button, and the search button from 768. */
  start: ReactNode;
  logo: ReactNode;
  /** Language link and theme control. */
  end: ReactNode;
};

/**
 * C-17 TopBar: the sticky bar at the top of every page, below the top ad row. Full page
 * width with the page gutter (not the shell). Three groups: the start and end groups share
 * the free width (flex 1 1 0), so the logo stays in the center at every width. Classes
 * `sticky top-0 z-(--z-bar) h-(--bar-height)`; no `.top-bar` CSS (DR-234). Page background,
 * a 1px bottom rule, no shadow. From 1280 the NavBar shows below the bar and the bar has
 * no rule of its own; when the bar sticks alone the rule returns (DR-173, NavBar.rules).
 */
export function TopBar({ start, logo, end }: Props) {
  return (
    <header
      data-top-bar
      className="sticky top-0 z-(--z-bar) h-(--bar-height) border-b border-border bg-background xl:border-b-0 [html[data-bar-stuck]_&]:xl:border-b"
    >
      <div className="flex h-full items-center px-(--top-bar-inset)">
        <div className="flex flex-1 basis-0 items-center">{start}</div>
        <div className="shrink-0 px-2">{logo}</div>
        <div className="flex flex-1 basis-0 items-center justify-end gap-1">
          {end}
        </div>
      </div>
    </header>
  );
}
