'use client';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string; issues: string[]; reason?: string };

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
interface ErrorBody { error?: { message?: string; details?: { issues?: unknown[]; reason?: string } } }

/** Issues are plain strings (readiness rules) or validation issues with a path and a message. */
function describeIssue(issue: unknown): string {
  if (typeof issue === 'string') return issue;
  if (typeof issue === 'object' && issue !== null && 'message' in issue) {
    const { message, path } = issue as { message: unknown; path?: unknown };
    const where = Array.isArray(path) && path.length > 0 ? `${path.join('.')}: ` : '';
    return `${where}${String(message)}`;
  }
  return String(issue);
}

/** Calls the newsroom's own `/api` proxy and turns the API's error envelope into something showable. */
export async function bff<T = unknown>(method: Method, path: string, body?: unknown): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api/${path.replace(/^\//, '')}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, status: 0, message: 'Could not reach the server. Check your connection.', issues: [] };
  }
  if (res.status === 401) {
    // A full page load on purpose: /auth/login is a route handler, not a Next.js page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    return { ok: false, status: 401, message: 'Signing you in again…', issues: [] };
  }
  const json: unknown = await res.json().catch(() => null);
  if (res.ok) return { ok: true, data: json as T };
  const { error } = (json ?? {}) as ErrorBody;
  const raw = Array.isArray(error?.details?.issues) ? error.details.issues : [];
  return {
    ok: false, status: res.status, message: error?.message ?? 'Something went wrong',
    issues: raw.map(describeIssue), reason: error?.details?.reason,
  };
}
