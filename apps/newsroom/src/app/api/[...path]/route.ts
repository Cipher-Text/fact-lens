import { NextResponse, type NextRequest } from 'next/server';
import { MAX_MEDIA_BYTES, mediaUploadTypes } from '@fact-lens/contracts';
import { isTrustedRequest } from '@/lib/csrf';
import { getSession } from '@/lib/current';
import { getEnv } from '@/lib/env';
import { apiUrl, isAllowedApiRequest } from '@/lib/proxy-allow';

export const dynamic = 'force-dynamic';

const MAX_BODY = 1_000_000;
const problem = (status: number, code: string, message: string) =>
  NextResponse.json({ error: { code, message, requestId: '' } }, { status });

/**
 * The browser never sees the API or its token. Requests arrive here with the session cookie;
 * this adds the bearer token and forwards the narrow set of routes the newsroom uses.
 */
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const env = getEnv();
  const { path } = await context.params;
  if (!isAllowedApiRequest(request.method, path)) return problem(404, 'not_found', 'Not found');
  if (!isTrustedRequest(request.method, request.headers.get('origin'), env.NEWSROOM_BASE_URL)) return problem(403, 'forbidden', 'Cross-site request refused');
  const session = await getSession();
  if (!session) return problem(401, 'unauthorized', 'Sign in again');

  // Everything is JSON except an image upload, which is the image's own bytes.
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
  const isUpload = request.method === 'POST' && path.length === 1 && path[0] === 'media';
  let body: string | Uint8Array | undefined;
  let upstreamType = 'application/json';
  if (isUpload) {
    if (!(mediaUploadTypes as readonly string[]).includes(contentType)) return problem(415, 'unsupported_media_type', 'Upload a JPEG, PNG or WebP image');
    const declared = Number(request.headers.get('content-length') ?? 0);
    if (declared > MAX_MEDIA_BYTES) return problem(413, 'payload_too_large', 'The image is too large');
    body = new Uint8Array(await request.arrayBuffer());
    if (body.length > MAX_MEDIA_BYTES) return problem(413, 'payload_too_large', 'The image is too large');
    upstreamType = contentType;
  } else if (request.method === 'POST' || request.method === 'PUT') {
    // A DELETE has no body, so it needs no content type either (the API rejects an empty JSON body).
    if (contentType !== 'application/json') return problem(415, 'unsupported_media_type', 'JSON only');
    body = await request.text();
    if (body.length > MAX_BODY) return problem(413, 'payload_too_large', 'Request too large');
  }

  let upstream: Response;
  try {
    upstream = await fetch(apiUrl(env.API_BASE_URL, path, request.nextUrl.search), {
      method: request.method,
      headers: {
        authorization: `Bearer ${session.accessToken}`, accept: 'application/json',
        ...(body !== undefined ? { 'content-type': upstreamType } : {}),
        'x-request-id': crypto.randomUUID(),
      },
      body: body as BodyInit | undefined, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return problem(502, 'bad_gateway', 'The API did not answer');
  }
  return new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json', 'cache-control': 'no-store' },
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
