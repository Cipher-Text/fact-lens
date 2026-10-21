import Link from "next/link";

import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { categoryHref } from "./links";

type EyebrowProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories">;
  className?: string;
};

/**
 * C-08 Eyebrow: the story's own category as a link to the category page, in type-eyebrow and
 * interactive color; hover and pressed colors, no underline, no background, no border. No Breaking or Live label
 * (COL-11, DR-279). The parent leaves the Eyebrow out when the
 * section heading already names the category (DR-114). It comes before the title in the DOM.
 */
export function Eyebrow({ story, strings, className }: EyebrowProps) {
  return (
    <p className={cn("type-eyebrow", className)}>
      <Link
        href={categoryHref(story.lang, story.category)}
        className="text-interactive hover:text-interactive-hover active:text-interactive-pressed"
      >
        {strings.categories[story.category]}
      </Link>
    </p>
  );
}
