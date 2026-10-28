"use client";

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
 * above the page title (gap, spec log url-format).
 */
export function MissingTranslationNote({ lang, text }: Props) {
  const only = useSearchParams().get(ONLY_IN_QUERY);
  if (only !== otherLang(lang)) return null;
  return (
    <Shell>
      <p
        role="status"
        className="pb-(--space-module) type-ui-sm text-ink-secondary"
      >
        {text}
      </p>
    </Shell>
  );
}
