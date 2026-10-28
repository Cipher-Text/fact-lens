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
 * Geopolitics, Economy, Security, Technology, History, Analysis and Opinion.
 * No fact-check item (DR-18). China is a region under Regions, not a nav item (DR-19).
 * Bangladesh is not a category; South Asia takes its place (DR-412).
 * Regions and Analysis and Opinion have sub-items, which only the Drawer shows (DR-255).
 * The category items go to the category pages, /category/<id> (/en/...), and the open
 * category is the current item (spacing-layout-system.md 7B, DR-181). South Asia goes to
 * /regions/south-asia, Regions to /regions and each region to /regions/<slug>; the children
 * Analysis and Opinion go to the hubs /analysis and /opinion (layout 7C, DR-411, DR-414).
 * Those pages are not built yet, so the links lead to a 404 page (IMP-18). There is no
 * Op-ed item (DR-302, DR-414). The parent Analysis and Opinion still links to its homepage
 * section, #analysis-opinion-title (DR-331; open flag, no rule yet); on any other page that
 * link goes to the homepage, so the # target exists.
 * The labels are the working category labels (U-01); the C-18 list names them shorter.
 * The Regions item reads অঞ্চলসমূহ / Regions (component-system.md Section 3.3, DR-345).
 */
export function getNavItems(
  t: Dictionary,
  lang: Lang,
  path: string = "/",
): NavItem[] {
  const home = localizedPath(lang);
  const section = (hash: string) => (path === "/" ? hash : `${home}${hash}`);
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
      id: "analysis-opinion",
      label: t.analysisOpinion.title,
      href: section("#analysis-opinion-title"),
      children: [
        {
          id: "analysis",
          label: t.analysisOpinion.analysis,
          href: localizedPath(lang, "/analysis"),
        },
        {
          id: "opinion",
          label: t.analysisOpinion.opinion,
          href: localizedPath(lang, "/opinion"),
        },
      ],
    },
  ];
}
