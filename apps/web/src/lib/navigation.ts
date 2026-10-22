import type { Lang } from "@/i18n";

/** A menu from the Fact Lens API: a parent with its child menus (GET /public/navigation/{locale}). */
export type ApiNavItem = {
  key: string;
  name: string;
  slug: string;
  children: { key: string; name: string; slug: string }[];
};

/** The API's language codes for the site's two languages. */
const apiLocale: Record<Lang, string> = { bn: "bn-BD", en: "en" };

const isRef = (v: unknown): v is { key: string; name: string; slug: string } =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Record<string, unknown>).key === "string" &&
  typeof (v as Record<string, unknown>).name === "string" &&
  typeof (v as Record<string, unknown>).slug === "string";

/** Keeps only well-formed menus; anything else from the network is dropped, not trusted. */
export function parseNavigation(data: unknown): ApiNavItem[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isRef).map((item) => {
    const children = (item as { children?: unknown }).children;
    return {
      key: item.key,
      name: item.name,
      slug: item.slug,
      children: Array.isArray(children) ? children.filter(isRef) : [],
    };
  });
}

/**
 * The news menu from the API, or null when it is not set up or not reachable, so the caller
 * shows the static menu instead. Off unless FACTLENS_API_URL is set: the prototype runs on mock
 * data by default (DR-01). Never throws.
 */
export async function fetchNavigation(
  lang: Lang,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiNavItem[] | null> {
  const base = process.env.FACTLENS_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return null;
  try {
    const res = await fetchImpl(
      `${base}/public/navigation/${encodeURIComponent(apiLocale[lang])}`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(2000) },
    );
    if (!res.ok) return null;
    const items = parseNavigation(await res.json());
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}
