'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Small outline icons, one per destination. Decorative: the label is always shown beside them. */
const icons: Record<string, string> = {
  '/': 'M3 5h14M3 10h14M3 15h9',
  '/news/new': 'M10 4v12M4 10h12',
  '/inbox': 'M3 6l7 5 7-5M3 6v9h14V6H3z',
  '/media': 'M3 4h14v12H3zM3 13l4-4 4 4 2-2 4 4M7 8h.01',
  '/taxonomy': 'M3 3h7l7 7-7 7-7-7V3zM7 7h.01',
  '/calendar': 'M4 5h12v11H4zM4 9h12M8 3v4M12 3v4',
  '/config': 'M4 6h12M4 14h12M8 4v4M12 12v4',
};

function Icon({ href }: { href: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={icons[href] ?? icons['/']} />
    </svg>
  );
}

/** The main menu: a vertical sidebar from the `lg` width up, a sideways-scrolling row below it. */
export function NavLinks({ items }: { items: Array<{ href: string; label: string }> }) {
  const path = usePathname();
  // The most specific match wins, so "New news item" does not also light up "News".
  const current = items.filter((i) => (i.href === '/' ? path === '/' : path === i.href || path.startsWith(`${i.href}/`))).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto px-1 py-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {items.map((item) => {
        const active = item.href === current;
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-line/60 hover:text-fg'}`}>
            <Icon href={item.href} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
