import { NextResponse, type NextRequest } from "next/server";

import { isLang } from "@/i18n";
import { clientAddressHeaders, siteClientAddress } from "@/lib/client-address";
import { apiBase, apiLocale, cleanVoterToken, VOTER_COOKIE } from "@/lib/poll-api";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The host of an Origin header, or null when it is not a web address (a sandboxed page sends "null"). */
const originHost = (origin: string): string | null => {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
};
const reply = (status: number, error: string) =>
  NextResponse.json({ error }, { status, headers: { "cache-control": "no-store" } });

/**
 * A reader's vote, passed to the API from this server so the voter cookie belongs to this site's
 * domain. The reader's address goes along as X-Forwarded-For, but only the one this site can vouch
 * for (see siteClientAddress); the reader's own header is never passed on.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const base = apiBase();
  if (!base) return reply(404, "Not found");
  const { id } = await context.params;
  if (!UUID.test(id)) return reply(404, "Not found");

  // A vote comes from this site's own pages: refuse a request another site's page made.
  const origin = request.headers.get("origin");
  if (origin && originHost(origin) !== request.headers.get("host")) return reply(403, "Cross-site request refused");

  let body: { optionId?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply(400, "Invalid request");
  }
  if (typeof body.optionId !== "string" || typeof body.lang !== "string" || !isLang(body.lang)) return reply(400, "Invalid request");

  const token = cleanVoterToken(request.cookies.get(VOTER_COOKIE)?.value);
  const address = siteClientAddress(request.headers);
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/public/polls/${id}/vote`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { cookie: `${VOTER_COOKIE}=${token}` } : {}),
        ...clientAddressHeaders(address),
      },
      body: JSON.stringify({ optionId: body.optionId, locale: apiLocale(body.lang) }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return reply(502, "The vote could not be sent");
  }
  const response = NextResponse.json(await upstream.json().catch(() => ({})), {
    status: upstream.status,
    headers: { "cache-control": "no-store" },
  });
  // The API's cookie (set only the first time) is passed on as it is: HttpOnly, for this site.
  for (const cookie of upstream.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  return response;
}
