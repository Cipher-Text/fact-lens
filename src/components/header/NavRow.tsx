"use client";

import { useLayoutEffect, useRef } from "react";

import { navLink } from "./classes";
import type { NavItem } from "./navItems";

type Props = {
  items: NavItem[];
  label: string;
};

/**
 * The nav row at shell width, from 1280px only (spacing-layout-system.md Section 6,
 * DR-41). It scrolls away with the page; only the top bar is sticky (LAY-15).
 * It shows the items that fit on one line and hides the rest. There is no "More"
 * item: every item is in the drawer. Hidden items leave the tab order.
 */
export function NavRow({ items, label }: Props) {
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

  return (
    <nav aria-label={label} className="shell max-xl:hidden" data-nav-row>
      <ul
        ref={listRef}
        className="flex min-h-(--nav-row-height) flex-wrap items-center gap-x-6"
      >
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              className={`inline-flex min-h-(--nav-row-height) items-center type-ui-sm font-semibold ${navLink}`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
