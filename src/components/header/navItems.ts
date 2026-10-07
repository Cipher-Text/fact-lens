import type { Dictionary } from "@/i18n";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
};

/**
 * The navigation: the six categories, then অঞ্চল with its regions as sub-items.
 * No fact-check item (DR-18). চীন is a region under অঞ্চল, not a nav item (DR-19).
 * Category and region pages do not exist yet, so the links go to the homepage
 * sections that FL-06 to FL-11 build (DR-01).
 */
export function getNavItems(t: Dictionary): NavItem[] {
  const categories = Object.entries(t.categories).map(([id, label]) => ({
    id,
    label,
    href: `#category-${id}`,
  }));
  const { title, ...regions } = t.regions;
  const regionItems = Object.entries(regions).map(([id, label]) => ({
    id,
    label,
    href: `#region-${id}`,
  }));
  return [
    ...categories,
    { id: "regions", label: title, href: "#regions", children: regionItems },
  ];
}
