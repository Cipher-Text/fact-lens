import { NextResponse, type NextRequest } from 'next/server';
import { isTrustedRequest } from '@/lib/csrf';
import { getEnv, isSecure } from '@/lib/env';
import { endSessionUrl } from '@/lib/oidc';
import { cookieNames, openSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** POST only, so a link or an image on another site cannot sign anyone out. */
export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!isTrustedRequest('POST', request.headers.get('origin'), env.NEWSROOM_BASE_URL)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const names = cookieNames(isSecure(env));
  const session = await openSession(request.cookies.get(names.session)?.value, env.SESSION_SECRET);
  let target = new URL('/signed-out', env.NEWSROOM_BASE_URL);
  try {
    target = (await endSessionUrl(env, session)) ?? target;
  } catch {
    // The provider is unreachable: the local session still ends.
  }
  const response = NextResponse.redirect(target, 303);
  response.cookies.delete(names.session);
  response.cookies.delete(names.flow);
  return response;
}
