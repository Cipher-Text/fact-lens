import { NextResponse, type NextRequest } from 'next/server';
import { endSignIn } from '@/lib/backend';
import { getEnv, isSecure } from '@/lib/env';
import { cookieNames, readSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Ends the sign-in at the API, clears the browser's session and shows the signed-out page. */
export async function GET(request: NextRequest) {
  const env = getEnv();
  const names = cookieNames(isSecure(env));
  const session = await readSession(request.cookies.get(names.session)?.value, env.SESSION_SECRET);
  await endSignIn(session?.refreshToken ?? null, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null);
  const response = NextResponse.redirect(new URL('/signed-out', env.NEWSROOM_BASE_URL));
  response.cookies.delete(names.session);
  return response;
}
