import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { Dictionary } from "@/i18n";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";

type MoreLinkProps = {
  href: string;
  /** The name of the section, column or rail, for screen readers. */
  section: string;
  strings: Dictionary["common"];
  className?: string;
};

/**
 * C-10 MoreLink: one "আরও দেখুন" per section, at the end of the section and its end edge
 * (CPT-14, CPT-15). text-xs 600 in interactive color, a 16px chevron 4px after the label,
 * a 44px tap height, no underline. The accessible name adds the section name.
 */
export function MoreLink({ href, section, strings, className }: MoreLinkProps) {
  return (
    <p className={cn("mt-(--space-more-link) text-end", className)}>
      <Link
        href={href}
        aria-label={fill(strings.moreAbout, { section })}
        className="inline-flex min-h-11 items-center gap-x-1 font-ui text-xs font-semibold text-interactive hover:text-interactive-hover active:text-interactive-pressed"
      >
        {strings.more}
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </p>
  );
}
