'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks({ items }: { items: Array<{ href: string; label: string }> }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="-mx-1 mt-1 flex gap-1 overflow-x-auto px-1 py-1">
      {items.map((item) => {
        const active = item.href === '/' ? path === '/' : path.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded px-3 py-1.5 text-sm ${active ? 'bg-accent text-accent-fg' : 'hover:bg-line/60'}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
