import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

export type AdSlot = "ad-band-top" | "ad-band" | "ad-inset";

// Tokens from src/styles/ads.css (spacing-layout-system.md Section 9).
const reservedHeight: Record<AdSlot, string> = {
  "ad-band-top": "h-(--ad-band-top-height)",
  "ad-band": "h-(--ad-band-height)",
  "ad-inset": "h-(--ad-inset-height)",
};

const creativeWidth: Record<AdSlot, string> = {
  "ad-band-top": "w-(--ad-band-top-width)",
  "ad-band": "w-(--ad-band-width)",
  "ad-inset": "w-(--ad-inset-width)",
};

type AdRowProps = {
  slot: AdSlot;
  strings: Dictionary["ads"];
  className?: string;
};

/**
 * One ad slot: the label line (--ad-label), then the reserved creative height (LAY-10).
 * ad-band-top and ad-band are full-width rows outside the shell; ad-inset sits in the
 * wrapper at wrapper width. No padding, margin or gutter (LAY-09); the section around it
 * owns space-module (LAY-12). Never sticky (LAY-11).
 */
export function AdRow({ slot, strings, className }: AdRowProps) {
  return (
    <div
      className={cn("ad-row grid-cols-1 bg-surface-alt", className)}
      data-ad-slot={slot}
    >
      <p className="flex min-h-(--ad-label) items-center type-eyebrow text-ink-muted">
        {strings.label}
      </p>
      <div className={cn("flex w-full justify-center", reservedHeight[slot])}>
        <AdPlaceholder
          className={creativeWidth[slot]}
          text={strings.placeholder}
        />
      </div>
    </div>
  );
}
