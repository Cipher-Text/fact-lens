import { InviteForm } from '@/components/sign-in/SignInForms';

export const dynamic = 'force-dynamic';

export default function InvitationPage() {
  return (
    <main className="mx-auto mt-16 w-full max-w-sm space-y-6 px-4">
      <h1 className="text-xl font-semibold">Set up your newsroom account</h1>
      <p className="text-sm text-muted">Choose a password, then set up an authenticator app on your phone.</p>
      <InviteForm />
    </main>
  );
}
