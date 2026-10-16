"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { uiLink } from "./classes";
import type { NavItem } from "./navItems";

type Props = {
  items: NavItem[];
  label: string;
};

/**
 * C-18 NavBar: the row of section links under the TopBar, at shell width, from 1280px only
 * (DR-41). It scrolls away with the page; only the top bar is sticky (LAY-15). It shows the
 * items that fit on one line and hides the rest. There is no "More" item: every item is in
 * the Drawer (DR-255). A hidden item leaves the tab order.
 *
 * NavBar.item: type-nav, 16px 600 on Bangla pages and 14px 600 on English pages; the role
 * changes by :lang, with no language variant here (DR-346). The row is 44px
 * (`--nav-row-height`) and the 1px rule at its bottom makes 45px in total (DR-349).
 *
 * NavBar.rules: the row keeps a 1px rule at its bottom. This component sets
 * `data-bar-stuck` on <html> when the row has scrolled behind the bar; the TopBar reads it
 * and shows its own bottom rule then (DR-173, DR-287). Under 1280px the row is hidden and
 * the bar sticks alone, so the bar is stuck as soon as the page has scrolled.
 */
export function NavBar({ items, label }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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
    const bar = document.querySelector<HTMLElement>("[data-top-bar]");
    if (!nav || !bar) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rowShown = nav.getClientRects().length > 0;
      const stuck = rowShown
        ? nav.getBoundingClientRect().bottom <= bar.offsetHeight
        : window.scrollY > 0;
      if (stuck) root.dataset.barStuck = "";
      else delete root.dataset.barStuck;
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
    <nav
      ref={navRef}
      aria-label={label}
      className="shell border-b border-border max-xl:hidden"
      data-nav-row
    >
      <ul
        ref={listRef}
        className="flex min-h-(--nav-row-height) flex-wrap items-center justify-center gap-x-7"
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
    </nav>
  );
}
