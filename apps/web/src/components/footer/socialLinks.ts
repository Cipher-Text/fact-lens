import type { SocialNetwork } from "./SocialIcon";

// The five social links of the Footer and the Drawer, in this order (component-system.md
// C-19, C-21; DR-182, DR-184). The Fact Lens accounts are not known yet, so each link
// goes to the network's front page (IMP-29).
export type SocialLink = { network: SocialNetwork; href: string };

/** The defaults. The real accounts come from the API's settings (lib/social-api.ts); a network without one keeps its link here. */
export const socialLinks: SocialLink[] = [
  { network: "facebook", href: "https://www.facebook.com/" },
  { network: "youtube", href: "https://www.youtube.com/" },
  { network: "x", href: "https://x.com/" },
  { network: "instagram", href: "https://www.instagram.com/" },
  { network: "linkedin", href: "https://www.linkedin.com/" },
];
