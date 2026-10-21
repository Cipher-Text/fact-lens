import { NextResponse, type NextRequest } from 'next/server';
import { getEnv, isSecure } from '@/lib/env';
import { startLogin } from '@/lib/oidc';
import { cookieNames, safeReturnTo, sealFlow } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const env = getEnv();
  try {
    const { url, flow } = await startLogin(env, safeReturnTo(request.nextUrl.searchParams.get('returnTo')));
    const response = NextResponse.redirect(url);
    response.cookies.set(cookieNames(isSecure(env)).flow, await sealFlow(flow, env.SESSION_SECRET), {
      httpOnly: true, secure: isSecure(env), sameSite: 'lax', path: '/', maxAge: 600,
    });
    return response;
  } catch (err) {
    console.error('sign-in could not start', err instanceof Error ? err.message : err);
    return NextResponse.redirect(new URL('/auth/error?reason=provider', env.NEWSROOM_BASE_URL));
  }
}
