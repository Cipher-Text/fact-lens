import { NextResponse, type NextRequest } from 'next/server';
import { endSignIn } from '@/lib/backend';
import { clientAddress } from '@/lib/client-address';
import { isTrustedRequest } from '@/lib/csrf';
import { getEnv, isSecure } from '@/lib/env';
import { cookieNames, readSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Ends the sign-in at the API, clears the browser's session and shows the signed-out page. A POST, from the app's own form, so another site cannot sign an editor out. */
export async function POST(request: NextRequest) {
  const env = getEnv();
  // The sign-out form is this site's own. Any other origin is refused, as the API proxy refuses it.
  if (!isTrustedRequest('POST', request.headers.get('origin'), env.NEWSROOM_BASE_URL)) {
    return new NextResponse('Cross-site request refused', { status: 403 });
  }
  const names = cookieNames(isSecure(env));
  const session = await readSession(request.cookies.get(names.session)?.value, env.SESSION_SECRET);
  await endSignIn(session?.refreshToken ?? null, clientAddress(request.headers.get('x-forwarded-for'), env.NEWSROOM_TRUST_PROXY));
  const response = NextResponse.redirect(new URL('/signed-out', env.NEWSROOM_BASE_URL));
  response.cookies.delete(names.session);
  return response;
}
