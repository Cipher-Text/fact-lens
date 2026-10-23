import { socialLinks, type SocialLink } from "@/components/footer/socialLinks";

import { apiBase } from "./poll-api";

type Saved = { network: string; url: string };

/**
 * The site's social links with the addresses the newsroom saved: each network keeps its place, and a
 * network with no saved address keeps its default link. Only an https address is taken from the API.
 */
export function mergeSocialLinks(saved: unknown): SocialLink[] {
  const list = (saved as { links?: unknown } | null)?.links;
  const byNetwork = new Map<string, string>();
  if (Array.isArray(list)) {
    for (const item of list as Saved[]) {
      if (item && typeof item.network === "string" && typeof item.url === "string" && item.url.startsWith("https://")) {
        byNetwork.set(item.network, item.url);
      }
    }
  }
  return socialLinks.map((link) => ({ ...link, href: byNetwork.get(link.network) ?? link.href }));
}

/**
 * The social links for the footer and the menu: the newsroom's addresses when `FACTLENS_API_URL` is
 * set and answers, else the defaults. Never throws.
 */
export async function fetchSocialLinks(fetchImpl: typeof fetch = fetch): Promise<SocialLink[]> {
  const base = apiBase();
  if (!base) return socialLinks;
  try {
    const res = await fetchImpl(`${base}/public/site/social-links`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(2000) });
    if (!res.ok) return socialLinks;
    return mergeSocialLinks(await res.json());
  } catch {
    return socialLinks;
  }
}
