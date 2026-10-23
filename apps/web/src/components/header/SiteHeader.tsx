import Link from "next/link";

import type { SocialLink } from "@/components/footer/socialLinks";
import { getTrendingTerms } from "@/content";
import { getDictionary, localizedPath, type Lang } from "@/i18n";

import { Drawer } from "./Drawer";
import { LanguageSwitch } from "./LanguageSwitch";
import { fetchNavigation } from "@/lib/navigation";

import { getApiNavItems, getNavItems } from "./navItems";
import { NavBar } from "./NavBar";
import { SearchDialog } from "./SearchDialog";
import { ThemeButton } from "./ThemeButton";
import { TopBar } from "./TopBar";

type Props = {
  lang: Lang;
  /** The current page path without the language prefix, for the language switch. */
  path?: string;
  /** The social links for the menu. The page passes the newsroom's addresses. */
  social?: SocialLink[];
};

/**
 * The page chrome (spacing-layout-system.md Section 6): the TopBar (C-17), then the NavBar
 * (C-18) from 1280. The Drawer (C-19) and the SearchDialog (C-20) open from the bar. The top
 * ad row goes below this, in the page (DR-295). The TopBar is the one header landmark and
 * the NavBar is a sibling nav landmark (DR-349).
 *
 * A fragment, not a wrapper (component-system §3). Both parts are sticky (LAY-15, DR-349):
 * the TopBar at the top, the NavBar just below it. Past the NavBar row the NavBar slides up
 * under the TopBar and is hidden, and the logo scales down (`nav-row-slide`, `logo-scale`).
 * The NavBar keeps its place in the flow, so the page does not move.
 *
 * Phones: menu | logo | En, ThemeButton. From 768px: menu, search | logo | English,
 * ThemeButton (one ThemeButton at every width, DR-349). No subscribe button (DR-188). The logo is a text stand-in in brand color until
 * the logo file exists (BRD-06, COL-04, U-08). The logo type is `type-logo` (DR-306).
 *
 * An async server component: it reads the menu from the API (`lib/navigation.ts`), with the
 * static menu as the fallback.
 */
export async function SiteHeader({ lang, path = "/", social }: Props) {
  const t = getDictionary(lang);
  // The menu comes from the API when FACTLENS_API_URL is set and answers; otherwise the static one.
  const menu = await fetchNavigation(lang);
  const items = menu
    ? getApiNavItems(menu, t, lang, path)
    : getNavItems(t, lang, path);
  const home = localizedPath(lang);

  return (
    <>
      <TopBar
        start={
          <>
            <Drawer
              items={items}
              strings={t.header}
              footerStrings={t.footer}
              siteName={t.site.name}
              homeHref={home}
              social={social}
            />
            <SearchDialog
              strings={t.header}
              trendingTerms={getTrendingTerms(lang)}
            />
          </>
        }
        logo={
          <Link
            href={home}
            aria-label={t.header.home}
            className="inline-block logo-scale type-logo whitespace-nowrap text-brand"
            data-logo
          >
            {t.site.name}
          </Link>
        }
        end={
          <>
            <LanguageSwitch lang={lang} path={path} />
            <ThemeButton strings={t.theme} />
          </>
        }
      />
      <NavBar items={items} label={t.header.mainNav} />
    </>
  );
}
