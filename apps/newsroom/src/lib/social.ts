import type { SocialNetwork } from '@fact-lens/contracts';

/** How the networks are named and what an address looks like, for the people forms. */
export const socialNames: Record<SocialNetwork, string> = { facebook: 'Facebook', youtube: 'YouTube', x: 'X', instagram: 'Instagram', linkedin: 'LinkedIn' };
export const socialExamples: Record<SocialNetwork, string> = {
  facebook: 'https://www.facebook.com/yourpage', youtube: 'https://www.youtube.com/@yourchannel', x: 'https://x.com/youraccount',
  instagram: 'https://www.instagram.com/youraccount', linkedin: 'https://www.linkedin.com/company/yourcompany',
};
