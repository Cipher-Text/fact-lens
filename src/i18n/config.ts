// Language config shared by the proxy, the layout and the language switch (DR-17).
// Bangla is at the root URL. English is under /en.

export const langs = ["bn", "en"] as const;
export type Lang = (typeof langs)[number];

export const defaultLang: Lang = "bn";

// Keeps the reader's language choice. Only the language switch sets it.
export const LANG_COOKIE = "fl-lang";

// The language switch adds this query to its link. The proxy stores it in the cookie.
export const LANG_QUERY = "lang";

// The language switch on an article that does not exist in the other language goes to the
// category page with this query, set to the article language, so that page shows a note
// (DR-401). The proxy keeps it when it removes LANG_QUERY.
export const ONLY_IN_QUERY = "only";

export function isLang(value: string | null | undefined): value is Lang {
  return value === "bn" || value === "en";
}

export function otherLang(lang: Lang): Lang {
  return lang === "bn" ? "en" : "bn";
}

/** Removes a leading /bn or /en from a path. Always returns a path that starts with "/". */
export function stripLang(pathname: string): string {
  const [, first = "", ...rest] = pathname.split("/");
  if (!isLang(first)) return pathname || "/";
  return "/" + rest.join("/");
}

/** The public URL path of a page in a language: "/x" in Bangla, "/en/x" in English. */
export function localizedPath(lang: Lang, path = "/"): string {
  const clean = stripLang(path);
  if (lang === defaultLang) return clean;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}
