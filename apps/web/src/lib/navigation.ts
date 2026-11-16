import { navigationSchema, publicTaxonomyRefSchema, type PublicNavItem } from "@fact-lens/contracts";
import type { Lang } from "@/i18n";
import { apiGet } from "./api/client";

/** A menu from the Fact Lens API: a parent with its child menus (GET /public/navigation/{locale}). */
export type ApiNavItem = PublicNavItem;

/** The API's language codes for the site's two languages. */
const apiLocale: Record<Lang, string> = { bn: "bn-BD", en: "en" };

/** Keeps only well-formed menus; anything else from the network is dropped, not trusted. */
export function parseNavigation(data: unknown): ApiNavItem[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const ref = publicTaxonomyRefSchema.safeParse(item);
    if (!ref.success) return [];
    const rawChildren = (item as { children?: unknown }).children;
    const children = Array.isArray(rawChildren)
      ? rawChildren.flatMap((child) => {
          const parsed = publicTaxonomyRefSchema.safeParse(child);
          return parsed.success ? [parsed.data] : [];
        })
      : [];
    return [{ ...ref.data, children }];
  });
}

/**
 * The news menu from the API, or null when it is not set up or not reachable, so the caller
 * shows the static menu instead. Off unless FACTLENS_API_URL is set (DR-01). Never throws.
 */
export async function fetchNavigation(
  lang: Lang,
  fetchImpl: typeof fetch = fetch,
): Promise<ApiNavItem[] | null> {
  if (!process.env.FACTLENS_API_URL?.trim()) return null;
  try {
    const items = await apiGet(
      `/public/navigation/${encodeURIComponent(apiLocale[lang])}`,
      navigationSchema,
      { next: { revalidate: 60 } },
      fetchImpl,
    );
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}
