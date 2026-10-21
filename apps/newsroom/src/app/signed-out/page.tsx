import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata = { title: 'Signed out' };

export default function SignedOut() {
  return (
    <main className="mx-auto max-w-md p-8">
      <div className="mb-6 flex justify-end"><ThemeToggle /></div>
      <h1 className="text-xl font-semibold">You are signed out</h1>
      <p className="mt-2 text-muted">Close this tab, or sign in again.</p>
      <a className="mt-4 inline-block rounded bg-accent px-4 py-2 text-accent-fg" href="/auth/login">Sign in</a>
    </main>
  );
}
