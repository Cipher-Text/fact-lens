import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SetupForm } from '@/components/sign-in/SignInForms';
import { getEnv, isSecure } from '@/lib/env';
import { cookieNames, openSignInFlow } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const env = getEnv();
  const jar = await cookies();
  const flow = await openSignInFlow(jar.get(cookieNames(isSecure(env)).flow)?.value, env.SESSION_SECRET);
  if (!flow?.enrolmentToken || !flow.secret) redirect('/sign-in');
  const secret = flow.secret.match(/.{1,4}/g)?.join(' ') ?? flow.secret;
  return (
    <main className="mx-auto mt-16 w-full max-w-sm space-y-6 px-4">
      <h1 className="text-xl font-semibold">Add this account to your authenticator app</h1>
      <p className="text-sm">Open your authenticator app, add an account, and enter this key (or open the link on your phone).</p>
      <p className="break-all rounded border border-line bg-panel px-3 py-2 font-mono text-sm">{secret}</p>
      <p className="text-sm"><a className="underline" href={flow.otpauthUrl}>Open in an authenticator app</a></p>
      <SetupForm />
    </main>
  );
}
