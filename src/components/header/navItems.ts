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
 * The navigation, in the order of component-system.md C-18: Home, South Asia, Regions,
 * Geopolitics, Economy, Security, Technology, History, Analysis.
 * No fact-check item (DR-18). China is a region under Regions, not a nav item (DR-19).
 * Bangladesh is not a category; South Asia takes its place (DR-412).
 * Regions has sub-items, which only the Drawer shows (DR-255).
 * The category items go to the category pages, /category/<id> (/en/...), and the open
 * category is the current item (spacing-layout-system.md 7B, DR-181). South Asia goes to
 * /regions/south-asia, Regions to /regions and each region to /regions/<slug> (layout 7C,
 * DR-411); those pages are not built yet, so the links lead to a 404 page (IMP-18).
 * Analysis is one item with no sub-items: it goes to the analysis hub /analysis and is the
 * current item there. Opinion is on hold, so it has no item (tajmin, 4 Nov 2026; this
 * replaces the parent Analysis and Opinion with its # link, DR-331). There is no Op-ed item
 * (DR-302, DR-414).
 * The labels are the working category labels (U-01); the C-18 list names them shorter.
 * The Regions item reads অঞ্চলসমূহ / Regions (component-system.md Section 3.3, DR-345).
 */
export function getNavItems(
  t: Dictionary,
  lang: Lang,
  path: string = "/",
): NavItem[] {
  const home = localizedPath(lang);
  const category = (id: keyof Dictionary["categories"]): NavItem => ({
    id,
    label: t.categories[id],
    href: localizedPath(lang, `/category/${id}`),
    current: path === `/category/${id}`,
  });
  // The regions are every entry of the region table, in its order.
  const regions = Object.entries(t.regions).map(([id, label]) => ({
    id,
    label,
    href: localizedPath(lang, `/regions/${id}`),
  }));

  return [
    { id: "home", label: t.header.navHome, href: home, current: path === "/" },
    {
      id: "south-asia",
      label: t.regions["south-asia"],
      href: localizedPath(lang, "/regions/south-asia"),
    },
    {
      id: "regions",
      label: t.header.navRegions,
      href: localizedPath(lang, "/regions"),
      children: regions,
    },
    category("geopolitics"),
    category("economy"),
    category("security"),
    category("technology"),
    category("history"),
    {
      id: "analysis",
      label: t.analysisOpinion.analysis,
      href: localizedPath(lang, "/analysis"),
      current: path === "/analysis",
    },
  ];
}
