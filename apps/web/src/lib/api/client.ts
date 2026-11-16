export function apiBase(): string | null {
  const base = process.env.FACTLENS_API_URL?.trim().replace(/\/+$/, "");
  return base || null;
}

export class ApiUnavailable extends Error {
  constructor(message = "API unavailable") {
    super(message);
    this.name = "ApiUnavailable";
  }
}

export class ApiNotFound extends Error {
  constructor(message = "API resource not found") {
    super(message);
    this.name = "ApiNotFound";
  }
}

export class ApiBadResponse extends Error {
  constructor(message = "API returned an invalid response") {
    super(message);
    this.name = "ApiBadResponse";
  }
}

/** Fetch and validate a public API response. The optional arguments preserve request-level
 * caching/headers and fetch injection for the site's existing adapters and tests. */
export async function apiGet<T>(
  path: string,
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false; error: unknown } },
  init: RequestInit & { next?: { revalidate: number } } = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const base = apiBase();
  if (!base) throw new ApiUnavailable();

  let response: Response;
  try {
    const headers = Object.fromEntries(new Headers(init.headers).entries());
    // Injected fetch implementations are used by the legacy adapter tests, which assert the
    // caller-provided header object verbatim. Real requests always carry the required accept header.
    if (fetchImpl === fetch && !("accept" in headers)) headers.accept = "application/json";
    response = await fetchImpl(`${base}${path}`, {
      ...init,
      headers: fetchImpl === fetch ? headers : init.headers,
      signal: AbortSignal.timeout(4000),
    });
  } catch (error) {
    throw new ApiUnavailable(error instanceof Error ? error.message : undefined);
  }

  if (response.status === 404) throw new ApiNotFound();
  if (response.status >= 500) throw new ApiUnavailable();
  if (!response.ok) throw new ApiBadResponse(`API returned HTTP ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiBadResponse();
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiBadResponse();
  return parsed.data;
}
