import {
  LANG_QUERY,
  getDictionary,
  localizedPath,
  otherLang,
  type Lang,
} from "@/i18n";

type Props = {
  lang: Lang;
  /** The current page path without the language prefix, for example "/latest". */
  path?: string;
};

/**
 * TopBar.language (C-17): a text link to the same page in the other language, type-ui-sm
 * at weight 600, ink, 44px tall. Bangla pages show "En" on phones (under 768px) and
 * "English" from 768px; English pages show "বাংলা" (T-27, DR-174). No hover and no
 * pressed color; the focus outline of the base rule only (DR-219). On phones the label sits
 * 1px lower (padding-top 2px) so its cap height centers on the bar like the icons (DR-178).
 *
 * The proxy keeps the choice in a cookie (DR-17). A plain <a>, so it works without
 * JavaScript and the link is never prefetched (a prefetch would set the cookie).
 */
export function LanguageSwitch({ lang, path = "/" }: Props) {
  const target = otherLang(lang);
  const href = `${localizedPath(target, path)}?${LANG_QUERY}=${target}`;
  const t = getDictionary(lang).language;

  return (
    <a
      href={href}
      lang={target}
      hrefLang={target}
      className="inline-flex min-h-11 items-center px-1 pt-0.5 type-ui-sm font-semibold text-ink md:px-2 md:pt-0"
    >
      <span className="md:hidden">{t.otherShort}</span>
      <span className="max-md:hidden">{t.other}</span>
    </a>
  );
}
