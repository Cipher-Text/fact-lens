import { socialLinks, type SocialLink } from "@/components/footer/socialLinks";
import { publicSocialLinksSchema } from "@fact-lens/contracts";

import { apiBase, apiGet } from "./api/client";

/**
 * The site's social links with the addresses from the API's settings: each network keeps its place, and a
 * network with no saved address keeps its default link. Only an https address is taken from the API.
 */
export function mergeSocialLinks(saved: unknown): SocialLink[] {
  const list = (saved as { links?: unknown } | null)?.links;
  const byNetwork = new Map<string, string>();
  if (Array.isArray(list)) {
    for (const item of list) {
      if (typeof item === "object" && item !== null && "network" in item && "url" in item && typeof item.network === "string" && typeof item.url === "string" && item.url.startsWith("https://")) {
        byNetwork.set(item.network, item.url);
      }
    }
  }
  return socialLinks.map((link) => ({ ...link, href: byNetwork.get(link.network) ?? link.href }));
}

/**
 * The social links for the footer and the menu: the API's configured addresses when `FACTLENS_API_URL` is
 * set and answers, else the defaults. Never throws.
 */
export async function fetchSocialLinks(fetchImpl: typeof fetch = fetch): Promise<SocialLink[]> {
  const base = apiBase();
  if (!base) return socialLinks;
  try {
    const response = await apiGet("/public/site/social-links", publicSocialLinksSchema, { next: { revalidate: 60 } }, fetchImpl);
    return mergeSocialLinks(response);
  } catch {
    return socialLinks;
  }
}
