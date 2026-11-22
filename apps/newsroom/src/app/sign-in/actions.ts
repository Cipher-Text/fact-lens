'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { acceptInvitation, BackendError, codeStep, confirmSetup, passwordStep, recoveryStep } from '@/lib/backend';
import { clientAddress } from '@/lib/client-address';
import { getEnv, isSecure } from '@/lib/env';
import { cookieNames, openSignInFlow, safeReturnTo, sealSession, sealSignInFlow, type SignInFlow } from '@/lib/session';

/** The editor's address, forwarded to the API so its limits count per editor and not per newsroom. */
async function editorAddress(): Promise<string | null> {
  const h = await headers();
  return clientAddress(h.get('x-forwarded-for'), getEnv().NEWSROOM_TRUST_PROXY);
}

export interface FormState {
  error?: string;
}

const messageOf = (err: unknown): string => {
  if (err instanceof BackendError) return err.message;
  throw err;
};

async function setFlow(flow: SignInFlow | null): Promise<void> {
  const env = getEnv();
  const names = cookieNames(isSecure(env));
  const jar = await cookies();
  if (!flow) {
    jar.delete(names.flow);
    return;
  }
  jar.set(names.flow, await sealSignInFlow(flow, env.SESSION_SECRET), {
    httpOnly: true, secure: isSecure(env), sameSite: 'strict', path: '/', maxAge: 600,
  });
}

async function currentFlow(): Promise<SignInFlow | null> {
  const env = getEnv();
  const jar = await cookies();
  return openSignInFlow(jar.get(cookieNames(isSecure(env)).flow)?.value, env.SESSION_SECRET);
}

/** Starts a signed-in session in the browser: the sealed session cookie, for as long as the sign-in lasts. */
async function startSession(session: Awaited<ReturnType<typeof codeStep>>): Promise<void> {
  const env = getEnv();
  const names = cookieNames(isSecure(env));
  const value = await sealSession(session, env.SESSION_SECRET);
  if (value.length > 3600) throw new Error('session too large');
  const jar = await cookies();
  jar.set(names.session, value, {
    httpOnly: true, secure: isSecure(env), sameSite: 'lax', path: '/',
    maxAge: Math.max(1, session.sessionExpiresAt - Math.floor(Date.now() / 1000)),
  });
  jar.delete(names.flow);
}

/** The password step. Good passwords move on to the code; anything else shows one neutral message. */
export async function signIn(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const returnTo = safeReturnTo(String(formData.get('returnTo') ?? '/'));
  let challengeToken: string;
  try {
    ({ challengeToken } = await passwordStep(email, password, await editorAddress()));
  } catch (err) {
    return { error: messageOf(err) };
  }
  await setFlow({ returnTo, challengeToken });
  redirect('/sign-in/code');
}

/** The code step: an authenticator code, or a recovery code when the authenticator is not to hand. */
export async function verifyCode(_previous: FormState, formData: FormData): Promise<FormState> {
  const flow = await currentFlow();
  if (!flow?.challengeToken) redirect('/sign-in');
  const useRecovery = formData.get('mode') === 'recovery';
  const value = String(formData.get('code') ?? '').trim();
  let session;
  try {
    session = useRecovery
      ? await recoveryStep(flow.challengeToken, value, await editorAddress())
      : await codeStep(flow.challengeToken, value, await editorAddress());
  } catch (err) {
    return { error: messageOf(err) };
  }
  await startSession(session);
  redirect(safeReturnTo(flow.returnTo));
}

/** Accepting an invitation: the password, then the authenticator setup. The token comes from the form, never the URL. */
export async function acceptSetup(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirm') ?? '');
  if (password !== confirmation) return { error: 'The two passwords do not match.' };
  let setup;
  try {
    setup = await acceptInvitation(token, password, await editorAddress());
  } catch (err) {
    return { error: messageOf(err) };
  }
  await setFlow({ returnTo: '/', enrolmentToken: setup.enrolmentToken, secret: setup.secret, otpauthUrl: setup.otpauthUrl });
  redirect('/sign-in/invitation/setup');
}

/** Confirming the authenticator app: the first code, which also gives the recovery codes shown once afterwards. */
export async function confirmSetupCode(_previous: FormState, formData: FormData): Promise<FormState> {
  const flow = await currentFlow();
  if (!flow?.enrolmentToken) redirect('/sign-in');
  let codes;
  try {
    codes = await confirmSetup(flow.enrolmentToken, String(formData.get('code') ?? '').trim(), await editorAddress());
  } catch (err) {
    return { error: messageOf(err) };
  }
  await setFlow({ returnTo: '/', recoveryCodes: codes });
  redirect('/sign-in/recovery-codes');
}

/** After the recovery codes are saved, the sign-in page takes over again. */
export async function finishRecoveryCodes(): Promise<void> {
  await setFlow(null);
  redirect('/sign-in');
}
