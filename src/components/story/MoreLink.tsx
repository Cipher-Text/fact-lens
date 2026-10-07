import Link from "next/link";

import type { Dictionary } from "@/i18n";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";

import { textLink, textLinkElevated } from "./links";

type MoreLinkProps = {
  href: string;
  /** The name of the section, column or rail, for screen readers. */
  section: string;
  strings: Dictionary["common"];
  /** The link sits on surface-elevated: the focus ring offset takes that color (COL-13). */
  elevated?: boolean;
  className?: string;
};

/**
 * The "আরও দেখুন" link below the last item of its block, aligned to the start, with
 * space-more-link above it (LAY-18). The visible text stays the same; the accessible name
 * adds the section name (typography-system.md 7.1).
 */
export function MoreLink({
  href,
  section,
  strings,
  elevated = false,
  className,
}: MoreLinkProps) {
  return (
    <p className={cn("mt-(--space-more-link) type-ui-sm", className)}>
      <Link
        href={href}
        aria-label={fill(strings.moreAbout, { section })}
        className={elevated ? textLinkElevated : textLink}
      >
        {strings.more}
      </Link>
    </p>
  );
}
