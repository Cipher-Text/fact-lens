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
 * The category items go to the category pages, /category/<id> (/en/...), and the open
 * category is the current item (docs/briefs/category.md, DR-181). Region pages do not exist
 * yet, so those links go to the homepage sections (DR-01). There is no Op-ed item (DR-302).
 * Both sub-items of Analysis and Opinion link to the section heading,
 * #analysis-opinion-title; every # target must exist (DR-331).
 * The labels are the working category labels (U-01); the C-18 list names them shorter.
 * The Regions item reads অঞ্চলসমূহ / Regions (component-system.md Section 3.3, DR-345).
 * On any other page the section links go to the homepage, so the # targets still exist.
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
  // The regions are every entry of the region table.
  const regions = Object.entries(t.regions).map(([id, label]) => ({
    id,
    label,
    href: section(`#region-${id}`),
  }));

  return [
    { id: "home", label: t.header.navHome, href: home, current: path === "/" },
    category("bangladesh"),
    {
      id: "regions",
      label: t.header.navRegions,
      href: section("#regions"),
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
          href: section("#analysis-opinion-title"),
        },
        {
          id: "opinion",
          label: t.analysisOpinion.opinion,
          href: section("#analysis-opinion-title"),
        },
      ],
    },
  ];
}
