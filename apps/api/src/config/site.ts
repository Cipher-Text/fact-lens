import { isSocialUrl, socialNetworks, type PublicContact, type PublicSocialLinks } from '@fact-lens/contracts';

/** The settings `siteFromEnv` reads (a part of the API's environment). */
export interface ApiEnvSocial {
  SITE_SOCIAL_FACEBOOK_URL?: string | undefined;
  SITE_SOCIAL_YOUTUBE_URL?: string | undefined;
  SITE_SOCIAL_X_URL?: string | undefined;
  SITE_SOCIAL_INSTAGRAM_URL?: string | undefined;
  SITE_SOCIAL_LINKEDIN_URL?: string | undefined;
  SITE_CONTACT_EMAIL?: string | undefined;
  SITE_CONTACT_PHONE?: string | undefined;
  SITE_CONTACT_ADDRESS?: string | undefined;
}

/** What the public site shows about itself: its social accounts and contact details. */
export interface SiteInfo {
  social: PublicSocialLinks;
  contact: PublicContact;
}

export const SITE_INFO = Symbol('SITE_INFO');

const SOCIAL_KEYS = {
  facebook: 'SITE_SOCIAL_FACEBOOK_URL', youtube: 'SITE_SOCIAL_YOUTUBE_URL', x: 'SITE_SOCIAL_X_URL',
  instagram: 'SITE_SOCIAL_INSTAGRAM_URL', linkedin: 'SITE_SOCIAL_LINKEDIN_URL',
} as const;

/**
 * The site's social links and contact details from the settings (`SITE_SOCIAL_*`, `SITE_CONTACT_*`). A social
 * address must be on its network's own domain, so a typing slip cannot put a stranger's site in the footer;
 * that is checked here, when the API starts, and a bad value stops the start with the name of the setting.
 */
export function siteFromEnv(env: ApiEnvSocial): SiteInfo {
  const links: PublicSocialLinks['links'] = [];
  for (const network of socialNetworks) {
    const url = env[SOCIAL_KEYS[network]];
    if (!url) continue;
    if (!isSocialUrl(network, url)) {
      throw new Error(`Invalid environment: ${SOCIAL_KEYS[network]}: must be an https address on the ${network} domain`);
    }
    links.push({ network, url });
  }
  return {
    social: { links },
    contact: { email: env.SITE_CONTACT_EMAIL ?? null, phone: env.SITE_CONTACT_PHONE ?? null, address: env.SITE_CONTACT_ADDRESS ?? null },
  };
}
