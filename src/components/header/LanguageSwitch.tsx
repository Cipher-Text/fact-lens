import {
  LANG_QUERY,
  getDictionary,
  localizedPath,
  otherLang,
  type Lang,
} from "@/i18n";

type Props = {
  lang: Lang;
  /** The current page path without the language prefix, for example "/foundations". */
  path?: string;
};

// Links to the same page in the other language. The proxy keeps the choice
// in a cookie (DR-17). A plain <a>, so it works without JavaScript and the
// link is never prefetched (a prefetch would set the cookie).
// The label is the other language's name, in that language (DR-78).
export function LanguageSwitch({ lang, path = "/" }: Props) {
  const target = otherLang(lang);
  const href = `${localizedPath(target, path)}?${LANG_QUERY}=${target}`;

  return (
    <a
      href={href}
      lang={target}
      hrefLang={target}
      className="inline-flex min-h-11 items-center px-2 type-ui-sm text-interactive underline-offset-4 hover:text-interactive-hover hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:text-interactive-pressed"
    >
      {getDictionary(lang).language.other}
    </a>
  );
}
