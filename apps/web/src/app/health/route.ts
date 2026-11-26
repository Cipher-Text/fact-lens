// Liveness for the platform's probes (D4). It answers while the process runs and does not call the API: when the API is
// down the site shows its unavailable page (src/proxy.ts), and restarting the site would not help. Outside [lang], so it
// has no language and is not rewritten by the proxy (see the matcher in src/proxy.ts).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
}
