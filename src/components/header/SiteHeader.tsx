import Link from "next/link";

import { getTrendingTerms } from "@/content";
import { getDictionary, localizedPath, type Lang } from "@/i18n";

import { Drawer } from "./Drawer";
import { LanguageSwitch } from "./LanguageSwitch";
import { getNavItems } from "./navItems";
import { NavBar } from "./NavBar";
import { SearchDialog } from "./SearchDialog";
import { ThemeButton } from "./ThemeButton";
import { ThemeToggle } from "./ThemeToggle";
import { TopBar } from "./TopBar";

type Props = {
  lang: Lang;
  /** The current page path without the language prefix, for the language switch. */
  path?: string;
};

/**
 * The page chrome (spacing-layout-system.md Section 6): the TopBar (C-17), then the NavBar
 * (C-18) from 1280. The Drawer (C-19) and the SearchDialog (C-20) open from the bar. The top
 * ad row goes above this, in the page. The bar and the nav row are siblings in <body>, so
 * the bar sticks for the whole page and the nav row scrolls away (LAY-15).
 *
 * Phones: menu | logo | En, theme button. From 768px: menu, search | logo | English, theme
 * switch. No subscribe button (DR-188). The logo is a text stand-in in brand color until
 * the logo file exists (BRD-06, COL-04, U-08).
 */
export function SiteHeader({ lang, path = "/" }: Props) {
  const t = getDictionary(lang);
  const items = getNavItems(t, lang, path);
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
            className="type-section-title whitespace-nowrap text-brand"
            data-logo
          >
            {t.site.name}
          </Link>
        }
        end={
          <>
            <LanguageSwitch lang={lang} path={path} />
            <ThemeButton strings={t.theme} />
            <ThemeToggle strings={t.theme} />
          </>
        }
      />
      <NavBar items={items} label={t.header.mainNav} />
    </>
  );
}
