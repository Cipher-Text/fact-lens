import Link from "next/link";

import { Shell } from "@/components/layout/Shell";
import { getDictionary, localizedPath, type Lang } from "@/i18n";
import { dhakaYear, fill, formatYear } from "@/lib/format";

import { SocialIcon } from "./SocialIcon";
import { socialLinks, type SocialLink } from "./socialLinks";

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
  /** The social links to show. The page passes the newsroom's addresses; the default is the placeholder list. */
  social?: SocialLink[];
};

/**
 * C-21 Footer (provisional, DR-193): the minimum footer after the last ad band. A panel band
 * (DR-264): full-width surface-elevated, content in the shell, block inset only (LAY-20).
 * Everything is centered: logo (type-logo-sm, DR-306), the five social links, the site
 * links (wrap to 2 lines on phones), the copyright line with the year in Dhaka time.
 * Footer landmark; the links are lists. Labels in the page
 * language. The design extension comes after run 2 (CMP-33): add nothing here.
 */
export function Footer({ lang, social = socialLinks }: Props) {
  const t = getDictionary(lang);
  const strings = t.footer;

  return (
    <footer className="bg-surface-elevated py-10 sm:py-12" data-footer>
      <Shell>
        <div className="flex flex-col items-center gap-6 text-center">
          <Link
            href={localizedPath(lang)}
            aria-label={t.header.home}
            className="type-logo-sm whitespace-nowrap text-brand"
            data-logo
          >
            {t.site.name}
          </Link>
          <ul
            aria-label={strings.social}
            className="flex flex-wrap justify-center gap-1"
          >
            {social.map(({ network, href }) => (
              <li key={network}>
                <a
                  href={href}
                  aria-label={strings[network]}
                  className="inline-flex size-(--icon-button-size) items-center justify-center text-ink hover:text-interactive-hover active:text-interactive-pressed"
                  data-social={network}
                >
                  <SocialIcon network={network} className="size-5" />
                </a>
              </li>
            ))}
          </ul>
          <nav aria-label={strings.siteNav}>
            <ul className="flex flex-wrap justify-center gap-x-6 type-ui-sm font-semibold">
              {sitePages.map((page) => (
                <li key={page}>
                  <Link
                    href={localizedPath(lang, `/${page}`)}
                    className="inline-flex min-h-11 items-center text-ink-secondary hover:text-interactive-hover active:text-interactive-pressed"
                  >
                    {strings[page]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="type-metadata text-ink-muted">
            {fill(strings.copyright, {
              year: formatYear(dhakaYear(), lang),
              name: t.site.name,
            })}
          </p>
        </div>
      </Shell>
    </footer>
  );
}
