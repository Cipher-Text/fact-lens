import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { CodeForm } from '@/components/sign-in/SignInForms';
import { getEnv, isSecure } from '@/lib/env';
import { cookieNames, openSignInFlow } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function CodePage({ searchParams }: { searchParams: Promise<{ recovery?: string }> }) {
  const env = getEnv();
  const jar = await cookies();
  const flow = await openSignInFlow(jar.get(cookieNames(isSecure(env)).flow)?.value, env.SESSION_SECRET);
  if (!flow?.challengeToken) redirect('/sign-in');
  const { recovery } = await searchParams;
  const useRecovery = recovery === '1';
  return (
    <main className="mx-auto mt-16 w-full max-w-sm space-y-6 px-4">
      <h1 className="text-xl font-semibold">{useRecovery ? 'Use a recovery code' : 'Enter your code'}</h1>
      <CodeForm recovery={useRecovery} />
      <p className="text-sm">
        {useRecovery ? (
          <Link className="underline" href="/sign-in/code">Use the authenticator app instead</Link>
        ) : (
          <Link className="underline" href="/sign-in/code?recovery=1">Use a recovery code instead</Link>
        )}
      </p>
    </main>
  );
}
