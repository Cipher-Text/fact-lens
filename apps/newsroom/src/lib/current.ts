import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { principalSchema, type Principal } from '@fact-lens/contracts';
import type { ZodType } from 'zod';
import { getEnv, isSecure } from './env';
import { cookieNames, openSession, type Session } from './session';

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly body: unknown) {
    super(message);
  }
}

/** True when the API refused a request because the sign-in lacked a second factor. */
export const isMfaRequired = (err: unknown) =>
  err instanceof ApiError && err.status === 403 && (err.body as { error?: { details?: { reason?: string } } } | null)?.error?.details?.reason === 'mfa_required';

export async function getSession(): Promise<Session | null> {
  const env = getEnv();
  const jar = await cookies();
  return openSession(jar.get(cookieNames(isSecure(env)).session)?.value, env.SESSION_SECRET);
}

export async function requireSession(returnTo = '/'): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}

/** Calls the API as the signed-in user and checks the answer against its contract. */
export async function api<T>(path: string, schema: ZodType<T>, opts: { returnTo?: string } = {}): Promise<T> {
  const session = await requireSession(opts.returnTo);
  const res = await fetch(`${getEnv().API_BASE_URL.replace(/\/$/, '')}${path}`, {
    headers: { authorization: `Bearer ${session.accessToken}`, accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 401) redirect(`/auth/login?returnTo=${encodeURIComponent(opts.returnTo ?? '/')}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error?.message ?? `API answered ${res.status}`, body);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(502, `Unexpected API response for ${path}`, parsed.error.issues);
  return parsed.data;
}

/** Who is signed in and what they may do. One call per request. */
export const getPrincipal = cache(async (): Promise<Principal> => api('/me', principalSchema));
