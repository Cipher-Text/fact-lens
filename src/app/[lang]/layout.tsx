import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDictionary, isLang, langs, localizedPath } from "@/i18n";
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

  return (
    // The theme script sets the .dark class before hydration (DR-281).
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-ink">{children}</body>
    </html>
  );
}
