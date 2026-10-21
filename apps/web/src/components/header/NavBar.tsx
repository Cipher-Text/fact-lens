"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { uiLink } from "./classes";
import type { NavItem } from "./navItems";

type Props = {
  items: NavItem[];
  label: string;
};

/**
 * C-18 NavBar: the row of section links under the TopBar, at shell width, from 1280px only
 * (DR-41). It is part of the sticky site header with the TopBar (LAY-15, DR-349). It shows the
 * items that fit on one line and hides the rest. There is no "More" item: every item is in
 * the Drawer (DR-255). A hidden item leaves the tab order.
 *
 * NavBar.item: type-nav, 16px 600 on Bangla pages and 14px 600 on English pages; the role
 * changes by :lang, with no language variant here (DR-346). The row is 44px
 * (`--nav-row-height`) and the 1px rule at its bottom makes 45px in total (DR-349).
 *
 * NavBar.rules: the row keeps a 1px rule at its bottom. This component sets
 * `data-bar-stuck` on <html> once the page has scrolled past the row (its height); the
 * TopBar reads it and shows its own bottom rule, and the logo scales down (DR-173, DR-287).
 * Then the row slides up under the TopBar (`nav-row-slide`, --duration-slide ease-slide) and is inert,
 * so it leaves the tab order. It shows again only at the page top (DR-349). Under 1280px the
 * row is hidden and the bar sticks alone, so the bar is stuck as soon as the page has
 * scrolled (DR-348).
 */
export function NavBar({ items, label }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [stuck, setStuck] = useState(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const fit = () => {
      const entries = Array.from(list.children) as HTMLElement[];
      entries.forEach((li) => (li.hidden = false));
      const first = entries[0];
      if (!first || list.getClientRects().length === 0) return;
      // An item that wraps to a second line does not fit.
      const top = first.offsetTop;
      entries.forEach((li) => (li.hidden = li.offsetTop > top));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(list);
    // Web fonts change the item widths after they load.
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const wasStuck = "barStuck" in root.dataset;
      // With the row shown: stuck past the row, and unstuck only at the page top, so the
      // row does not come back on a small scroll up. Without it: stuck once scrolled.
      const next =
        nav.getClientRects().length > 0
          ? y >= nav.offsetHeight || (wasStuck && y > 0)
          : y > 0;
      if (next) root.dataset.barStuck = "";
      else delete root.dataset.barStuck;
      setStuck(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      delete root.dataset.barStuck;
    };
  }, []);

  return (
    // The band is full width in the page color, so the page does not show beside the shell
    // while it scrolls under the pinned row. The shell holds the items and the rule (C-18,
    // DR-357). The list is one row tall from the server HTML (max-height, overflow hidden):
    // items that wrap are cut off whole until `fit` hides them, so the page does not move at
    // hydration (LAY-17 exception, DR-359, IMP-90).
    <nav
      ref={navRef}
      aria-label={label}
      inert={stuck}
      className="header-focus nav-row-slide bg-background max-xl:hidden"
      data-nav-row
    >
      <div className="shell border-b border-border" data-nav-shell>
        <ul
          ref={listRef}
          className="flex max-h-(--nav-row-height) min-h-(--nav-row-height) flex-wrap items-center justify-center gap-x-7 overflow-hidden"
        >
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-(--nav-row-height) items-center type-nav aria-[current=page]:border-b-3 aria-[current=page]:border-(--color-bar)",
                  uiLink,
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
