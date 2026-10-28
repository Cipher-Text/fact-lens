"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Shell } from "@/components/layout/Shell";
import { ONLY_IN_QUERY, otherLang, type Lang } from "@/i18n";

type Props = {
  lang: Lang;
  /** "This story is in Bangla only", in the page language. */
  text: string;
};

/**
 * The note for a reader who came from an article that does not exist in this language
 * (DR-401, layout 7C.4). The language switch on that article links to this category page
 * with ?only=<the article language>. No sheet covers the note yet: a neutral text line
 * above the page title (gap U-48, spec log url-format UF-06).
 *
 * The status region is in the server HTML and stays empty there; the text comes in after
 * hydration, because the page is static and only the browser reads the query. A screen
 * reader announces text added to a region that already exists, not a region added with
 * its text (PR #15 review).
 */
export function MissingTranslationNote({ lang, text }: Props) {
  return (
    <Shell data-note>
      <p role="status" className="type-ui-sm text-ink-secondary">
        <Suspense fallback={null}>
          <NoteText lang={lang} text={text} />
        </Suspense>
      </p>
    </Shell>
  );
}

function NoteText({ lang, text }: Props) {
  const only = useSearchParams().get(ONLY_IN_QUERY);
  if (only !== otherLang(lang)) return null;
  return <span className="block pb-(--space-module)">{text}</span>;
}
