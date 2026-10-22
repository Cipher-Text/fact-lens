import { NavLinks } from '@/components/NavLinks';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getPrincipal, getSession } from '@/lib/current';
import { visibleNav } from '@/lib/nav';

// Every page here depends on who is signed in, so none may be built ahead of time.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [principal, session] = await Promise.all([getPrincipal(), getSession()]);
  const items = visibleNav(principal);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-panel focus:px-3 focus:py-2">Skip to content</a>
      <div className="lg:flex lg:min-h-screen">
        <aside className="border-b border-line bg-panel px-3 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-4">
          <div className="mb-2 flex items-center gap-2.5 px-2 lg:mb-5">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">FL</span>
            <span className="leading-tight">
              <span className="block font-semibold">Fact Lens</span>
              <span className="block text-xs text-muted">Newsroom admin</span>
            </span>
          </div>
          <NavLinks items={items.map(({ href, label }) => ({ href, label }))} />
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-end gap-3 border-b border-line bg-panel px-4 py-2.5 text-sm">
            <ThemeToggle />
            <span title={principal.capabilities.join(', ') || 'No permissions'} className="leading-tight">
              <span className="block font-medium">{session?.name ?? principal.subject}</span>
              <span className="block text-xs text-muted">{principal.roles.join(', ') || 'no role'}</span>
            </span>
            <form action="/auth/logout" method="post">
              <button type="submit" className="rounded-lg border border-line bg-panel px-3 py-1.5 font-medium">Sign out</button>
            </form>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </>
  );
}
