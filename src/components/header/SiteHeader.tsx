import Link from "next/link";

import { getDictionary, localizedPath, type Lang } from "@/i18n";

import { filledButton, focusRing } from "./classes";
import { Drawer } from "./Drawer";
import { LanguageSwitch } from "./LanguageSwitch";
import { getNavItems } from "./navItems";
import { NavRow } from "./NavRow";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  lang: Lang;
  /** The current page path without the language prefix, for the language switch. */
  path?: string;
};

/**
 * The top bar and the nav row (spacing-layout-system.md Section 6, DR-41 to DR-43, DR-21).
 * The top ad row goes above this, in the page. The bar and the nav row are siblings
 * in <body>, so the bar sticks for the whole page and the nav row scrolls away (LAY-15).
 *
 * Bar: a 1fr auto 1fr grid, so the logo stays in the center.
 * Phones: menu | logo | language, theme. From 768px: menu, search | logo | language,
 * theme, Subscribe. The logo is a text stand-in in brand color (COL-04, U-08).
 */
export function SiteHeader({ lang, path = "/" }: Props) {
  const t = getDictionary(lang);
  const items = getNavItems(t);

  return (
    <>
      <header className="top-bar border-b border-border bg-background">
        <div className="shell grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center gap-1">
            <Drawer items={items} strings={t.header} />
            <SearchDialog strings={t.header} />
          </div>

          <Link
            href={localizedPath(lang)}
            aria-label={t.header.home}
            className={`type-section-title whitespace-nowrap text-brand ${focusRing}`}
            data-logo
          >
            {t.site.name}
          </Link>

          <div className="flex items-center justify-end gap-1">
            <LanguageSwitch lang={lang} path={path} />
            <ThemeToggle strings={t.theme} />
            <a
              href="#newsletter"
              className={`${filledButton} ${focusRing} ms-2 max-md:hidden`}
            >
              {t.header.subscribe}
            </a>
          </div>
        </div>
      </header>
      <NavRow items={items} label={t.header.mainNav} />
    </>
  );
}
