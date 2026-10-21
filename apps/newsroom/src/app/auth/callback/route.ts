import { NextResponse, type NextRequest } from 'next/server';
import { getEnv, isSecure } from '@/lib/env';
import { finishLogin } from '@/lib/oidc';
import { cookieNames, MAX_COOKIE_VALUE, openFlow, safeReturnTo, sealSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const env = getEnv();
  const names = cookieNames(isSecure(env));
  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/auth/error?reason=${reason}`, env.NEWSROOM_BASE_URL));
    response.cookies.delete(names.flow);
    return response;
  };

  const flow = await openFlow(request.cookies.get(names.flow)?.value, env.SESSION_SECRET);
  if (!flow) return fail('expired');
  try {
    const session = await finishLogin(env, flow, request.nextUrl.search);
    let value = await sealSession(session, env.SESSION_SECRET);
    if (value.length > MAX_COOKIE_VALUE) value = await sealSession({ ...session, idToken: undefined }, env.SESSION_SECRET);
    if (value.length > MAX_COOKIE_VALUE) return fail('too-large');

    const response = NextResponse.redirect(new URL(safeReturnTo(flow.returnTo), env.NEWSROOM_BASE_URL));
    response.cookies.set(names.session, value, {
      httpOnly: true, secure: isSecure(env), sameSite: 'lax', path: '/', maxAge: Math.max(1, session.expiresAt - Math.floor(Date.now() / 1000)),
    });
    response.cookies.delete(names.flow);
    return response;
  } catch (err) {
    console.error('sign-in failed', err instanceof Error ? err.message : err);
    return fail('rejected');
  }
}
