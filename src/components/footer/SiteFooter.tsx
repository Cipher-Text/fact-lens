import Link from "next/link";

import { focusRing, iconButton } from "@/components/header/classes";
import { Shell } from "@/components/layout/Shell";
import { textLink } from "@/components/story/links";
import { getDictionary, localizedPath, type Lang } from "@/i18n";

import { SocialIcon } from "./SocialIcon";
import { socialLinks } from "./socialLinks";

// The site pages do not exist yet, so these links lead to a 404 page (IMP-29).
const sitePages = [
  "about",
  "contact",
  "corrections",
  "privacy",
  "terms",
] as const;

type Props = {
  lang: Lang;
};

/**
 * The minimum footer (spacing-layout-system.md 7.1 row 15 and 7.4, DR-59): a full-width
 * row with its content in the shell. Row 1: the logo and the social links, each with a
 * text name for screen readers. Row 2: About, Contact, Corrections, Privacy and Terms.
 * All labels in the page language (T-27).
 *
 * The footer design is not ready, so the look is neutral (AGENTS.md Section 8, U-30):
 * a 1px border rule across the full width, the page background, space-module above and
 * below, links in type-ui-sm and text-interactive, 44px targets.
 */
export function SiteFooter({ lang }: Props) {
  const t = getDictionary(lang);
  const strings = t.footer;

  return (
    <footer className="border-t border-border bg-background" data-footer>
      <Shell className="flex flex-col gap-(--space-list-item) py-(--space-module)">
        <div className="flex flex-wrap items-center justify-between gap-(--space-list-item)">
          <Link
            href={localizedPath(lang)}
            aria-label={t.header.home}
            className={`type-section-title whitespace-nowrap text-brand ${focusRing}`}
            data-logo
          >
            {t.site.name}
          </Link>
          <ul aria-label={strings.social} className="flex flex-wrap">
            {socialLinks.map(({ network, href }) => (
              <li key={network}>
                <a
                  href={href}
                  aria-label={strings[network]}
                  className={iconButton}
                  data-social={network}
                >
                  <SocialIcon network={network} className="size-6" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <nav aria-label={strings.siteNav}>
          <ul className="flex flex-wrap gap-x-(--grid-column-gap) type-ui-sm">
            {sitePages.map((page) => (
              <li key={page}>
                <Link
                  href={localizedPath(lang, `/${page}`)}
                  className={`inline-flex min-h-11 items-center ${textLink}`}
                >
                  {strings[page]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Shell>
    </footer>
  );
}
