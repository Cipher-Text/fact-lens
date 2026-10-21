import { NextResponse, type NextRequest } from 'next/server';
import { loadNewsroomEnv } from '@fact-lens/config';
import { cookieNames, openSession } from '@/lib/session';

/**
 * Sends anyone without a valid session to sign in. This is a convenience for pages: the API
 * checks the token on every call, so a session that slips past here still gets no data.
 */
export async function proxy(request: NextRequest) {
  const env = loadNewsroomEnv();
  const secure = new URL(env.NEWSROOM_BASE_URL).protocol === 'https:';
  const session = await openSession(request.cookies.get(cookieNames(secure).session)?.value, env.SESSION_SECRET);
  if (session) return NextResponse.next();

  const target = new URL('/auth/login', env.NEWSROOM_BASE_URL);
  target.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(target);
}

export const config = {
  // Everything except sign-in itself, static assets, the API proxy (which answers 401 as JSON) and the signed-out page.
  matcher: ['/((?!auth/|api/|_next/|signed-out|favicon\\.ico).*)'],
};
