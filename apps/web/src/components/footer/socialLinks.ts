import type { SocialNetwork } from "./SocialIcon";

// The five social links of the Footer and the Drawer, in this order (component-system.md
// C-19, C-21; DR-182, DR-184). The Fact Lens accounts are not known yet, so each link
// goes to the network's front page (IMP-29).
export const socialLinks: { network: SocialNetwork; href: string }[] = [
  { network: "facebook", href: "https://www.facebook.com/" },
  { network: "youtube", href: "https://www.youtube.com/" },
  { network: "x", href: "https://x.com/" },
  { network: "instagram", href: "https://www.instagram.com/" },
  { network: "linkedin", href: "https://www.linkedin.com/" },
];
