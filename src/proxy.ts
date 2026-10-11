import { NextResponse, type NextRequest } from "next/server";

import {
  LANG_COOKIE,
  LANG_QUERY,
  defaultLang,
  isLang,
  localizedPath,
  stripLang,
} from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Bangla at the root URL, English under /en (DR-17).
// The language comes from the URL and the reader's own choice only.
// This proxy never reads Accept-Language.
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";

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
      });
    }
    return response;
  }

  // Bangla pages have no /bn prefix in their public URL.
  if (first === defaultLang) {
    const url = request.nextUrl.clone();
    url.pathname = stripLang(pathname);
    return NextResponse.redirect(url, 308);
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
  // Skip Next.js internals and files with an extension (images, icons, fonts).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
