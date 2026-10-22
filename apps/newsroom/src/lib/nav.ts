import { editorialCapabilities, type Capability, type Principal } from '@fact-lens/contracts';

export interface NavItem {
  href: string;
  label: string;
  /** Visible when the person holds any of these. Hiding is a convenience: the API is what enforces. */
  anyOf: readonly Capability[];
}

export const navItems: readonly NavItem[] = [
  { href: '/', label: 'Desk queue', anyOf: editorialCapabilities },
  { href: '/news/new', label: 'New news item', anyOf: ['news.edit'] },
  { href: '/inbox', label: 'Source inbox', anyOf: ['news.edit', 'news.review'] },
  { href: '/media', label: 'Media library', anyOf: ['media.manage', 'news.edit'] },
  { href: '/taxonomy', label: 'Sections and tags', anyOf: ['taxonomy.manage'] },
  { href: '/calendar', label: 'Publishing calendar', anyOf: ['news.publish'] },
  { href: '/config', label: 'Configuration', anyOf: ['config.manage'] },
];

export const visibleNav = (principal: Principal): NavItem[] =>
  navItems.filter((item) => item.anyOf.some((c) => principal.capabilities.includes(c)));

export const can = (principal: Principal, capability: Capability) => principal.capabilities.includes(capability);
