"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";

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
 * NavBar.rules: the row keeps a 1px rule at its bottom. While the row is in view the TopBar
 * has no rule of its own; when the row has scrolled away and the TopBar sticks alone, the
 * rule returns (DR-173). This component tells the TopBar through `data-bar-stuck` on <html>.
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

  // The bar is "stuck alone" when the row has scrolled up behind it. The root margin takes
  // the bar height (64px from 1024) off the top of the viewport.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const root = document.documentElement;
    const barHeight =
      document.querySelector<HTMLElement>("[data-top-bar]")?.offsetHeight ?? 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const stuck = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        if (stuck) root.dataset.barStuck = "";
        else delete root.dataset.barStuck;
      },
      { rootMargin: `-${barHeight}px 0px 0px 0px` },
    );
    observer.observe(nav);
    return () => {
      observer.disconnect();
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
              className={`inline-flex min-h-(--nav-row-height) items-center type-ui-sm font-semibold aria-[current=page]:border-b-3 aria-[current=page]:border-(--color-bar) ${uiLink}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
