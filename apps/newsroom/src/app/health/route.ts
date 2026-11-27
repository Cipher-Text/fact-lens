// Liveness for the platform's probes (D6, after D4). It answers while the process runs and does not call the API. It is
// excluded from the sign-in redirect in src/proxy.ts, so an unsigned-in probe is not sent to the sign-in page.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });
}
