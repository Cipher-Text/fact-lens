import { DevQuickLogin, SignInForm } from '@/components/sign-in/SignInForms';
import { devAccounts } from '@/lib/backend';
import { getEnv } from '@/lib/env';
import { safeReturnTo } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const target = safeReturnTo(returnTo);
  // Development only (ADR-064): the dev accounts, when DEV_QUICK_LOGIN is on. Never listed otherwise.
  const accounts = getEnv().DEV_QUICK_LOGIN ? await devAccounts() : [];
  return (
    <main className="mx-auto mt-16 w-full max-w-sm space-y-6 px-4">
      <h1 className="text-xl font-semibold">Sign in to the newsroom</h1>
      <SignInForm returnTo={target} />
      {accounts.length > 0 ? <DevQuickLogin accounts={accounts} returnTo={target} /> : null}
    </main>
  );
}
