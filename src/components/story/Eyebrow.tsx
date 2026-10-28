import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { categoryHref, formatHref } from "./links";

/**
 * category: the story's category, a link to the category page (default).
 * format: on an analysis story, বিশ্লেষণ / Analysis, a link to /analysis; any other story
 * shows its category. Mixed lists set it: the homepage lead and top stories (DR-417).
 * two-part: article pages only. On analysis and opinion, the format link, a separator, then
 * the category link; news shows the category only (DR-416). Cards never use it.
 */
export type EyebrowMode = "category" | "format" | "two-part";

type EyebrowProps = {
  story: Story;
  strings: Pick<Dictionary, "categories" | "analysisOpinion">;
  mode?: EyebrowMode;
  className?: string;
};

const linkClass =
  "text-interactive hover:text-interactive-hover active:text-interactive-pressed";

/**
 * C-08 Eyebrow: the label above a story title, in type-eyebrow and interactive color; hover
 * and pressed colors, no underline, no background, no border. No Breaking or Live label
 * (COL-11, DR-279). The parent leaves the Eyebrow out when the section heading already names
 * the category (DR-114). It comes before the title in the DOM.
 */
export function Eyebrow({
  story,
  strings,
  mode = "category",
  className,
}: EyebrowProps) {
  const categoryLink = (
    <Link href={categoryHref(story.lang, story.category)} className={linkClass}>
      {strings.categories[story.category]}
    </Link>
  );

  if (mode === "two-part" && story.format !== "news") {
    // Each part wraps as a whole unit; the separator stays with the first part (C-08).
    return (
      <p className={cn("flex flex-wrap type-eyebrow", className)}>
        <span>
          <Link
            href={formatHref(story.lang, story.format)}
            className={linkClass}
          >
            {strings.analysisOpinion[story.format]}
          </Link>
          <span
            aria-hidden="true"
            data-eyebrow-separator
            className="mx-(--space-eyebrow-separator) text-ink-muted"
          >
            ·
          </span>
        </span>
        {categoryLink}
      </p>
    );
  }

  return (
    <p className={cn("type-eyebrow", className)}>
      {mode === "format" && story.format === "analysis" ? (
        <Link href={formatHref(story.lang, "analysis")} className={linkClass}>
          {strings.analysisOpinion.analysis}
        </Link>
      ) : (
        categoryLink
      )}
    </p>
  );
}
