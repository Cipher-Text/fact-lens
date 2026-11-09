import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDictionary, isLang, langs, localizedPath } from "@/i18n";
import { readerSizeScript } from "@/lib/reader-size";
import { storyTimeScript } from "@/lib/story-time";
import { themeScript } from "@/lib/theme";

import {
  notoSansBengali,
  notoSerifBengali,
  plusJakarta,
  sourceSerif,
} from "../fonts";
import "../globals.css";

const fontVariables = [
  sourceSerif.variable,
  plusJakarta.variable,
  notoSerifBengali.variable,
  notoSansBengali.variable,
].join(" ");

export const dynamicParams = false;

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: { default: t.site.name, template: `%s · ${t.site.name}` },
    description: t.site.description,
    alternates: {
      languages: {
        bn: localizedPath("bn"),
        en: localizedPath("en"),
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { justNow, hourAgo, hoursAgo } = getDictionary(lang).story;

  return (
    // The theme script sets the .dark class before hydration (DR-281). The reader size
    // script sets the stored text size on an article before the first paint (TYP-15).
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: readerSizeScript }} />
      </head>
      <body className="bg-background text-ink">
        {children}
        {/* Writes the reader's story times after load (TYP-17, DR-274). */}
        <script
          dangerouslySetInnerHTML={{
            __html: storyTimeScript(lang, justNow, hourAgo, hoursAgo),
          }}
        />
      </body>
    </html>
  );
}
