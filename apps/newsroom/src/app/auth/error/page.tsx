import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = { title: 'Sign-in problem' };

const messages: Record<string, string> = {
  expired: 'The sign-in took too long or was opened in another browser. Start again.',
  rejected: 'The identity provider did not accept the sign-in. Start again.',
  provider: 'The identity provider could not be reached. Try again in a moment.',
  'too-large': 'Your sign-in response was too large to keep. Ask an administrator to reduce the token size.',
};

export default async function SignInError({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return (
    <main className="mx-auto max-w-md p-8">
      <div className="mb-6 flex justify-end"><ThemeToggle /></div>
      <h1 className="text-xl font-semibold">Sign-in problem</h1>
      <p className="mt-2 text-muted" role="alert">{messages[reason ?? ''] ?? 'Something went wrong while signing in.'}</p>
      <a className="mt-4 inline-block rounded bg-accent px-4 py-2 text-accent-fg" href="/auth/login">Try again</a>
    </main>
  );
}
