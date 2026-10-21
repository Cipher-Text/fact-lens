import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PeerRowProps = HTMLAttributes<HTMLElement> & { as?: "div" | "ul" };

/**
 * A row of cards with equal rank (spacing-layout-system.md Section 8).
 * Homepage: 1 card per row below 600px, 2 from 600px. No 3-up or 4-up (LAY-07, DR-44).
 */
export function PeerRow({
  as: Tag = "div",
  className,
  ...props
}: PeerRowProps) {
  return (
    <Tag
      className={cn(
        "grid grid-cols-1 gap-x-(--grid-column-gap) gap-y-(--grid-row-gap) sm:grid-cols-2",
        className,
      )}
      {...props}
    />
  );
}

type PeerCardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "li" | "article";
  /** The number of card parts: 4 without a summary, 5 with one (Section 12.3). */
  parts: number;
};

/**
 * One card in a PeerRow. It spans one parent row per card part and uses subgrid, so the
 * parts line up across the row. A missing part leaves its row empty (LAY-08).
 * The parent row gap stays between card rows only: the parts have no gap of their own here.
 * The card variant sets the space between its parts (component pass, U-02).
 */
export function PeerCard({
  as: Tag = "div",
  parts,
  className,
  style,
  ...props
}: PeerCardProps) {
  return (
    <Tag
      className={cn("peer-card gap-y-0", className)}
      style={{ "--card-parts": parts, ...style } as CSSProperties}
      {...props}
    />
  );
}
