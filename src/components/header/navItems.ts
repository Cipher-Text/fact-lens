import { localizedPath, type Dictionary, type Lang } from "@/i18n";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  /** The link to the page that is open now (aria-current="page"). */
  current?: boolean;
  children?: NavItem[];
};

/**
 * The navigation, in the order of component-system.md C-18: Home, Bangladesh, Regions,
 * Geopolitics, Economy, Security, Technology, History, Analysis and Opinion.
 * No fact-check item (DR-18). China is a region under Regions, not a nav item (DR-19).
 * Regions and Analysis and Opinion have sub-items, which only the Drawer shows (DR-255).
 * Category and region pages do not exist yet, so the links go to the homepage sections
 * (DR-01). There is no Op-ed item (DR-302). Both sub-items of Analysis and Opinion link to
 * the section heading, #analysis-opinion-title; every # target must exist (DR-331).
 * The labels are the working category labels (U-01); the C-18 list names them shorter.
 * The Regions item reads অঞ্চলসমূহ / Regions (component-system.md Section 3.3, DR-345).
 */
export function getNavItems(
  t: Dictionary,
  lang: Lang,
  path: string = "/",
): NavItem[] {
  const category = (id: keyof Dictionary["categories"]): NavItem => ({
    id,
    label: t.categories[id],
    href: `#category-${id}`,
  });
  // The regions are every entry of the table but the section heading.
  const regions = Object.entries(t.regions)
    .filter(([id]) => id !== "title")
    .map(([id, label]) => ({ id, label, href: `#region-${id}` }));
  const home = localizedPath(lang);

  return [
    { id: "home", label: t.header.navHome, href: home, current: path === "/" },
    category("bangladesh"),
    {
      id: "regions",
      label: t.header.navRegions,
      href: "#regions",
      children: regions,
    },
    category("geopolitics"),
    category("economy"),
    category("security"),
    category("technology"),
    category("history"),
    {
      id: "analysis-opinion",
      label: t.analysisOpinion.title,
      href: "#analysis-opinion-title",
      children: [
        {
          id: "analysis",
          label: t.analysisOpinion.analysis,
          href: "#analysis-opinion-title",
        },
        {
          id: "opinion",
          label: t.analysisOpinion.opinion,
          href: "#analysis-opinion-title",
        },
      ],
    },
  ];
}
