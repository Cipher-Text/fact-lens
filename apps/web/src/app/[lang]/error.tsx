"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { getDictionary, isLang, localizedPath } from "@/i18n";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ lang: string }>();
  const lang = isLang(params.lang) ? params.lang : "bn";
  const t = getDictionary(lang);

  return (
    <main className="mx-auto max-w-page px-gutter py-section">
      <h1 className="font-editorial text-4xl font-semibold text-ink">{t.unavailable.title}</h1>
      <p className="mt-3 font-reading text-lg leading-relaxed text-ink-secondary">{t.unavailable.body}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link className="text-interactive underline focus-visible:outline-2" href={localizedPath(lang)}>
          {t.header.navHome}
        </Link>
        <button className="text-interactive underline focus-visible:outline-2" onClick={reset} type="button">
          {t.unavailable.retry}
        </button>
      </div>
    </main>
  );
}
