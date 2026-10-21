import { editorialCapabilities, type Capability, type Principal } from '@fact-lens/contracts';

export interface NavItem {
  href: string;
  label: string;
  /** Visible when the person holds any of these. Hiding is a convenience: the API is what enforces. */
  anyOf: readonly Capability[];
}

export const navItems: readonly NavItem[] = [
  { href: '/', label: 'Desk queue', anyOf: editorialCapabilities },
  { href: '/stories/new', label: 'New story', anyOf: ['story.edit'] },
  { href: '/inbox', label: 'Source inbox', anyOf: ['story.edit', 'story.review'] },
  { href: '/media', label: 'Media library', anyOf: ['media.manage', 'story.edit'] },
  { href: '/calendar', label: 'Publishing calendar', anyOf: ['story.publish'] },
  { href: '/config', label: 'Configuration', anyOf: ['config.manage'] },
];

export const visibleNav = (principal: Principal): NavItem[] =>
  navItems.filter((item) => item.anyOf.some((c) => principal.capabilities.includes(c)));

export const can = (principal: Principal, capability: Capability) => principal.capabilities.includes(capability);
