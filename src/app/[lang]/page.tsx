import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/header/SiteHeader";
import { AdRow } from "@/components/layout/AdRow";
import { getDictionary, isLang, localizedPath } from "@/i18n";

const linkClass =
  "text-interactive underline underline-offset-4 hover:text-interactive-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:text-interactive-pressed";

// Homepage. Page order: spacing-layout-system.md Section 7.1.
// The sections come in FL-06 and later; a placeholder stands in for them.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <>
      <AdRow slot="ad-band-top" strings={t.ads} />
      <SiteHeader lang={lang} />
      {/* Temporary: min-h-dvh makes the page tall enough to test the top bar on scroll. FL-06 replaces this. */}
      <main
        id="main"
        className="shell flex min-h-dvh flex-col gap-(--space-module) py-(--space-page-start)"
      >
        <h1 className="type-page-title text-ink">{t.site.name}</h1>
        <p className="type-ui text-ink-secondary">{t.home.placeholder}</p>
        <p className="type-ui">
          <Link
            href={localizedPath(lang, "/foundations")}
            className={linkClass}
          >
            {t.home.foundationsLink}
          </Link>
        </p>
        <p className="type-ui">
          <Link
            href={localizedPath(lang, "/layout-parts")}
            className={linkClass}
          >
            {t.home.layoutPartsLink}
          </Link>
        </p>
      </main>
    </>
  );
}
