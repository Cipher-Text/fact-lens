import { NextResponse, type NextRequest } from "next/server";

import { currentStoryRef } from "@/content";

import {
  LANG_COOKIE,
  LANG_QUERY,
  defaultLang,
  isLang,
  localizedPath,
  stripLang,
} from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

// A path with a file extension is a file from public/ (images, icons). It keeps its URL.
const FILE_PATH = /\.[^/]+$/;

// An article path, /story/<slug>-<id>, after the language prefix (layout 7C).
const STORY_PATH = /^\/story\/([^/]+)$/;

// Bangla at the root URL, English under /en (DR-17).
// The language comes from the URL and the reader's own choice only.
// This proxy never reads Accept-Language.
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (FILE_PATH.test(pathname)) return NextResponse.next();

  // The language switch links to "?lang=xx". Keep the choice, then go to the clean URL.
  const chosen = searchParams.get(LANG_QUERY);
  if (chosen !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(LANG_QUERY);
    if (isLang(chosen)) url.pathname = localizedPath(chosen, pathname);
    const response = NextResponse.redirect(url);
    if (isLang(chosen)) {
      response.cookies.set(LANG_COOKIE, chosen, {
        path: "/",
        maxAge: ONE_YEAR,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    // The answer sets a cookie, so no cache may keep it (DR-328).
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  // Bangla pages have no /bn prefix in their public URL.
  if (first === defaultLang) {
    const url = request.nextUrl.clone();
    url.pathname = stripLang(pathname);
    return NextResponse.redirect(url, 308);
  }

  // A wrong or old slug gets a 301 to the current URL (DR-413). A 301, not the 308 of
  // Next.js permanentRedirect(), so it is done here and not in the page.
  const lang = isLang(first) ? first : defaultLang;
  const story = STORY_PATH.exec(stripLang(pathname));
  const current = story && currentStoryRef(story[1], lang);
  if (current) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(lang, `/story/${current}`);
    return NextResponse.redirect(url, 301);
  }

  if (isLang(first)) return NextResponse.next();

  // A reader who chose English starts at /en when they open the front page.
  // Other Bangla URLs stay in Bangla, so shared links open as sent.
  if (pathname === "/" && request.cookies.get(LANG_COOKIE)?.value === "en") {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath("en", "/");
    const response = NextResponse.redirect(url);
    // The answer depends on the cookie, so no shared cache may keep it.
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Every path except api/ and _next/ (DR-328). Files from public/ pass through in the proxy.
  matcher: ["/((?!api/|_next/).*)"],
};
