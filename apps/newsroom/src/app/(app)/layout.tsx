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
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold">Fact Lens Newsroom</span>
            <NavLinks items={items.map(({ href, label }) => ({ href, label }))} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <span title={principal.capabilities.join(', ') || 'No permissions'}>
              {session?.name ?? principal.subject}
              <span className="ml-2 text-muted">{principal.roles.join(', ') || 'no role'}</span>
            </span>
            <form action="/auth/logout" method="post">
              <button type="submit" className="rounded border border-line px-2 py-1">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
