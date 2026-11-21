import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { finishRecoveryCodes } from '@/app/sign-in/actions';
import { buttonClass } from '@/components/ui';
import { getEnv, isSecure } from '@/lib/env';
import { cookieNames, openSignInFlow } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function RecoveryCodesPage() {
  const env = getEnv();
  const jar = await cookies();
  const flow = await openSignInFlow(jar.get(cookieNames(isSecure(env)).flow)?.value, env.SESSION_SECRET);
  if (!flow?.recoveryCodes?.length) redirect('/sign-in');
  return (
    <main className="mx-auto mt-16 w-full max-w-sm space-y-6 px-4">
      <h1 className="text-xl font-semibold">Save your recovery codes</h1>
      <p className="text-sm">Each code works once, if you cannot use your authenticator app. They are shown only now.</p>
      <ul className="grid grid-cols-2 gap-2 rounded border border-line bg-panel p-3 font-mono text-sm">
        {flow.recoveryCodes.map((code) => <li key={code}>{code}</li>)}
      </ul>
      <form action={finishRecoveryCodes}>
        <button type="submit" className={buttonClass('primary')}>I have saved them</button>
      </form>
    </main>
  );
}
