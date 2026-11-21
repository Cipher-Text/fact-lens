import { SignInForm } from '@/components/sign-in/SignInForms';
import { safeReturnTo } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return (
    <main className="mx-auto mt-16 w-full max-w-sm space-y-6 px-4">
      <h1 className="text-xl font-semibold">Sign in to the newsroom</h1>
      <SignInForm returnTo={safeReturnTo(returnTo)} />
    </main>
  );
}
