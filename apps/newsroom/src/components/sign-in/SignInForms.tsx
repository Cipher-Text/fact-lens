'use client';

import { useActionState } from 'react';
import type { DevAccount } from '@fact-lens/contracts';
import { acceptSetup, confirmSetupCode, devSignIn, signIn, verifyCode, type FormState } from '@/app/sign-in/actions';
import { buttonClass, inputClass } from '@/components/ui';

const initial: FormState = {};

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="text-sm text-danger">{message}</p>;
}

export function SignInForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      <FormError message={state.error} />
      <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Checking…' : 'Continue'}</button>
    </form>
  );
}

/**
 * Development only (ADR-064): one button per dev account, each signing in with no password and no code. The sign-in page
 * shows it only when DEV_QUICK_LOGIN is on, which the environment check refuses in production.
 */
export function DevQuickLogin({ accounts, returnTo }: { accounts: DevAccount[]; returnTo: string }) {
  const [state, action, pending] = useActionState(devSignIn, initial);
  return (
    <form action={action} className="space-y-3 border-t pt-6" aria-label="Quick sign-in for development">
      <input type="hidden" name="returnTo" value={returnTo} />
      <h2 className="text-sm font-semibold">Quick sign-in <span className="font-normal text-muted">(development only)</span></h2>
      <ul className="space-y-2">
        {accounts.map((account) => (
          <li key={account.email}>
            <button type="submit" name="email" value={account.email} disabled={pending} className={`${buttonClass('secondary')} flex w-full items-center justify-between gap-3 text-left`}>
              <span>{account.displayName}</span>
              <span className="text-xs text-muted">{account.roles.join(', ')}</span>
            </button>
          </li>
        ))}
      </ul>
      <FormError message={state.error} />
    </form>
  );
}

/** The code step. Shows the authenticator field, or the recovery field when asked for. */
export function CodeForm({ recovery }: { recovery: boolean }) {
  const [state, action, pending] = useActionState(verifyCode, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="mode" value={recovery ? 'recovery' : 'code'} />
      {recovery ? (
        <label className="block space-y-1 text-sm">
          <span>Recovery code</span>
          <input name="code" required autoComplete="one-time-code" placeholder="abcd-efgh" className={inputClass} />
        </label>
      ) : (
        <label className="block space-y-1 text-sm">
          <span>Code from your authenticator app</span>
          <input name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" className={inputClass} />
        </label>
      )}
      <FormError message={state.error} />
      <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Checking…' : 'Sign in'}</button>
    </form>
  );
}

/**
 * The invitation form. The token is in the link's fragment (#token=…), which the browser never sends to the server; this
 * form reads it and passes it on as a form field.
 */
export function InviteForm() {
  const [state, action, pending] = useActionState(acceptSetup, initial);
  return (
    <form action={action} className="space-y-4">
      <input
        type="hidden"
        name="token"
        ref={(el) => {
          if (el) el.value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
        }}
      />
      <label className="block space-y-1 text-sm">
        <span>Choose a password (at least 12 characters)</span>
        <input name="password" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Type it again</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={12} required className={inputClass} />
      </label>
      <FormError message={state.error} />
      <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Saving…' : 'Continue'}</button>
    </form>
  );
}

/** Confirming the authenticator app with its first code. */
export function SetupForm() {
  const [state, action, pending] = useActionState(confirmSetupCode, initial);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span>The six-digit code the app shows now</span>
        <input name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" className={inputClass} />
      </label>
      <FormError message={state.error} />
      <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Checking…' : 'Confirm'}</button>
    </form>
  );
}
