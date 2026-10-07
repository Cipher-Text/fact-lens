import Link from "next/link";
import { notFound } from "next/navigation";

import { LanguageSwitch } from "@/components/header/LanguageSwitch";
import { ThemeSwitch } from "@/components/header/ThemeSwitch";
import { getDictionary, isLang, localizedPath } from "@/i18n";

// Placeholder homepage until the sections are built (FL-05 and later).
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <main className="shell flex flex-col gap-(--space-module) py-(--space-page-start)">
      <div className="flex flex-wrap items-center gap-4">
        <LanguageSwitch lang={lang} />
        <ThemeSwitch strings={t.theme} />
      </div>
      <h1 className="type-page-title text-ink">{t.site.name}</h1>
      <p className="type-ui text-ink-secondary">{t.home.placeholder}</p>
      <p className="type-ui">
        <Link
          href={localizedPath(lang, "/foundations")}
          className="text-interactive underline underline-offset-4 hover:text-interactive-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:text-interactive-pressed"
        >
          {t.home.foundationsLink}
        </Link>
      </p>
      <p className="type-ui">
        <Link
          href={localizedPath(lang, "/layout-parts")}
          className="text-interactive underline underline-offset-4 hover:text-interactive-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:text-interactive-pressed"
        >
          {t.home.layoutPartsLink}
        </Link>
      </p>
    </main>
  );
}
