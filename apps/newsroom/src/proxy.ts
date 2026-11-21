import { NextResponse, type NextRequest } from 'next/server';
import { loadNewsroomEnv, type NewsroomEnv } from '@fact-lens/config';
import { refreshShared } from '@/lib/backend';
import { cookieNames, readSession, sealSession } from '@/lib/session';

/**
 * Keeps the editor signed in and sends anyone without a sign-in to the sign-in page (ADR-046, step A7).
 * - A session whose access token is about to expire is refreshed here. The new cookie goes to the browser and is also
 *   put on the request, so the page or API route that handles this request already sees the new token.
 * - The API route answers 401 as JSON, never a redirect, so the browser's own handling can show the sign-in again.
 * The API checks the token on every call anyway: nothing here is what keeps data private.
 */

const REFRESH_BEFORE_SECONDS = 120;

const clientAddress = (request: NextRequest): string | null => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

function signInRedirect(request: NextRequest, env: NewsroomEnv): NextResponse {
  const target = new URL('/sign-in', env.NEWSROOM_BASE_URL);
  target.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(target);
}

/** The request continues with the given session cookie: the browser gets it, and so does the handler for this request. */
function continueWith(request: NextRequest, name: string, value: string, secure: boolean, maxAge: number): NextResponse {
  const cookie = request.cookies.getAll().map((c) => (c.name === name ? `${name}=${value}` : `${c.name}=${c.value}`)).join('; ');
  const headers = new Headers(request.headers);
  headers.set('cookie', cookie);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(name, value, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge });
  return response;
}

export async function proxy(request: NextRequest) {
  const env = loadNewsroomEnv();
  const secure = new URL(env.NEWSROOM_BASE_URL).protocol === 'https:';
  const names = cookieNames(secure);
  const isApi = request.nextUrl.pathname.startsWith('/api/');
  const session = await readSession(request.cookies.get(names.session)?.value, env.SESSION_SECRET);
  const now = Math.floor(Date.now() / 1000);

  if (!session || session.sessionExpiresAt <= now) {
    if (isApi) return NextResponse.next();
    const response = signInRedirect(request, env);
    if (session) response.cookies.delete(names.session);
    return response;
  }
  if (session.expiresAt - now > REFRESH_BEFORE_SECONDS) return NextResponse.next();

  try {
    const fresh = await refreshShared(session.refreshToken, clientAddress(request));
    const value = await sealSession(fresh, env.SESSION_SECRET);
    return continueWith(request, names.session, value, secure, Math.max(1, fresh.sessionExpiresAt - now));
  } catch {
    // The refresh was refused (the sign-in ended, or the token was used elsewhere): the editor signs in again.
    if (isApi) {
      const response = NextResponse.next();
      response.cookies.delete(names.session);
      return response;
    }
    const response = signInRedirect(request, env);
    response.cookies.delete(names.session);
    return response;
  }
}

export const config = {
  // Everything except the sign-in pages, the sign-out route, static assets and the signed-out page.
  matcher: ['/((?!sign-in|auth/|_next/|signed-out|favicon\\.ico).*)'],
};
