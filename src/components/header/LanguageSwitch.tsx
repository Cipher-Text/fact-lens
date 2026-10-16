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
 * at weight 600, ink. As tall as the ghost icon buttons: 32px under 768, 36px from 768 (a
 * minimum, so 200% text grows it; LAY-17, DR-349). Bangla pages show "En" on phones (under
 * 768px) and "English" from 768px; English pages show "বাংলা" (T-27, DR-174). UI link: hover
 * interactive-hover, pressed interactive-pressed, no underline (COL-06, DR-349). On phones
 * the label sits 1px lower (padding-top 2px) so its cap height centers on the bar like the
 * icons (DR-178).
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
      className="inline-flex min-h-(--icon-button-size-ghost) items-center px-1 pt-0.5 type-ui-sm font-semibold text-ink transition-colors hover:text-interactive-hover active:text-interactive-pressed md:px-2 md:pt-0"
    >
      <span className="md:hidden">{t.otherShort}</span>
      <span className="max-md:hidden">{t.other}</span>
    </a>
  );
}
