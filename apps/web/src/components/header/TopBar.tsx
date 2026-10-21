import type { ReactNode } from "react";

import { ScrollOffset } from "./ScrollOffset";

type Props = {
  /** Menu button, and the search button from 768. */
  start: ReactNode;
  logo: ReactNode;
  /** Language link and theme control. */
  end: ReactNode;
};

/**
 * C-17 TopBar: the sticky bar at the top of every page. Full page width with the page
 * gutter (not the shell). Three groups: the start and end groups share the free width
 * (flex 1 1 0), so the logo stays in the center at every width. Classes
 * `sticky top-0 z-(--z-bar) min-h-(--bar-height)`: a minimum, so at 200% text the bar wraps
 * to two lines (row 1 menu and logo, row 2 the controls at the end) and stays sticky
 * (DR-265). No `.top-bar` CSS (DR-234). Page background, no shadow.
 *
 * The 1px bottom rule shows only when the bar is stuck, at every width, in both themes. The
 * NavBar sets `data-bar-stuck` on <html>; the bar reads it through the `bar-stuck` variant
 * (DR-287, DR-295). The border is transparent until then, so the bar does not move.
 */
export function TopBar({ start, logo, end }: Props) {
  return (
    <header
      data-top-bar
      className="header-focus sticky top-0 z-(--z-bar) flex min-h-(--bar-height) flex-col border-b border-transparent bg-background bar-stuck:border-border"
    >
      <ScrollOffset />
      <div className="flex flex-1 flex-wrap items-center px-(--top-bar-inset)">
        <div className="flex flex-1 basis-0 items-center gap-1">{start}</div>
        <div className="shrink-0 px-2">{logo}</div>
        <div className="flex flex-1 basis-0 items-center justify-end gap-1">
          {end}
        </div>
      </div>
    </header>
  );
}
