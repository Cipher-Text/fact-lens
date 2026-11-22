import { NextRequest, NextResponse } from "next/server";

import { viewBeaconSchema } from "@fact-lens/contracts";
import { apiBase } from "@/lib/api/client";
import { clientAddressHeaders, siteClientAddress } from "@/lib/client-address";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function POST(request: NextRequest) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return new NextResponse(null, { status: 400, headers: noStore });
  }
  const parsed = viewBeaconSchema.safeParse(input);
  if (!parsed.success) return new NextResponse(null, { status: 400, headers: noStore });

  const base = apiBase();
  if (base) {
    const rawReferrer = parsed.data.referrer;
    let referrer: string | undefined;
    if (rawReferrer) {
      try {
        referrer = new URL(rawReferrer).hostname || undefined;
      } catch {
        referrer = undefined;
      }
    }
    const address = siteClientAddress(request.headers);
    try {
      await fetch(`${base}/public/views`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...clientAddressHeaders(address),
        },
        body: JSON.stringify({ ...parsed.data, ...(referrer ? { referrer } : { referrer: undefined }) }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      console.error("View beacon forwarding failed", error);
    }
  }

  return new NextResponse(null, { status: 204, headers: noStore });
}
