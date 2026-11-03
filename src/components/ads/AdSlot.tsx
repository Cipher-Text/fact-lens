import { getAd, type AdSlotId, type Lang } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

export type AdSlotVariant = "top" | "band" | "inset" | "rail" | "inline";

type Tier = { media: string; size: string };

// One <source> per tier, widest first; the first match wins (spacing-layout-system.md
// 9.2). 21rem is 336px, 48rem 768px, 64rem 1024px, 80rem 1280px. The creative sizes come
// from the slot table in Section 9 and the sheet C-16; `fallback` is the phone size.
const tiers: Record<
  AdSlotVariant,
  { slot: AdSlotId; sources: Tier[]; fallback: string }
> = {
  top: {
    slot: "ad-top",
    sources: [
      { media: "(min-width: 64rem)", size: "970x250" },
      { media: "(min-width: 48rem)", size: "728x90" },
    ],
    fallback: "320x100",
  },
  band: {
    slot: "ad-band",
    sources: [
      { media: "(min-width: 64rem)", size: "970x250" },
      { media: "(min-width: 48rem)", size: "728x90" },
      { media: "(min-width: 21rem)", size: "336x280" },
    ],
    fallback: "300x250",
  },
  inset: {
    slot: "ad-inset",
    sources: [{ media: "(min-width: 80rem)", size: "728x90" }],
    fallback: "300x250",
  },
  rail: { slot: "ad-rail", sources: [], fallback: "300x600" },
  // Article pages (wild card): ad-inline has no sizes in the spec yet ("Later"), so it
  // is a 300×250 box in the reading column at every width and borrows the ad-inset mock
  // creative. UNRESOLVED_DESIGN_SYSTEM.
  inline: { slot: "ad-inset", sources: [], fallback: "300x250" },
};

// The row: top and band are full-width rows, inset is at wrapper width, rail is the rail
// box, shown from 1280 only (DR-245). `ad-row` and `ad-inset` come from layout.css.
const rowClass: Record<AdSlotVariant, string> = {
  top: "ad-row",
  band: "ad-row",
  inset: "ad-inset",
  rail: "hidden xl:grid justify-items-center",
  inline: "ad-inset",
};

// The reserved creative box (LAY-10, LAY-19): sizes from the --ad-* tokens in px.
const boxClass: Record<AdSlotVariant, string> = {
  top: "w-(--ad-top-w) max-w-full h-(--ad-top-h)",
  band: "w-full h-(--ad-band-h)",
  inset: "w-(--ad-inset-w) max-w-full h-(--ad-inset-h)",
  rail: "w-(--ad-rail-w) h-(--ad-rail-h) items-start",
  inline: "w-(--ad-inline-w) max-w-full h-(--ad-inline-h)",
};

type AdSlotProps = {
  variant: AdSlotVariant;
  lang: Lang;
  strings: Dictionary["ads"];
  /**
   * rail only: the tier it shows from. xl (1280, the homepage P-3 rail, DR-245) or lg (1024,
   * the analysis hub mosaic rail, beside the wrapper from 1024; tajmin, 4 Nov 2026).
   */
  railFrom?: "lg" | "xl";
};

// The rail row from 1024 (railFrom lg). Whole strings so Tailwind finds them.
const railFromLg = "hidden lg:grid justify-items-center";

/**
 * AdSlot (C-16): one ad row. A surface-alt band with a 24px label line, then the
 * reserved creative box with the creative centered. No padding, margin or gutter
 * (LAY-09); the section around it owns space-module (LAY-12). Never sticky (LAY-11).
 * One <picture> with a <source> per tier, so the browser loads only the file for the
 * current tier. Only `top` loads at once; the others are lazy (9.1). Not a landmark: a
 * div with no aria-label; the visible label names the slot and is not hidden (DR-266).
 */
export function AdSlot({
  variant,
  lang,
  strings,
  railFrom = "xl",
}: AdSlotProps) {
  const { slot, sources, fallback } = tiers[variant];
  const ad = getAd(slot, lang);
  const bySize = new Map(
    ad.creatives.map((c) => [`${c.width}x${c.height}`, c]),
  );
  const fallbackCreative = bySize.get(fallback);
  if (!fallbackCreative)
    throw new Error(`No ${fallback} mock creative for slot: ${slot}`);

  return (
    <div
      data-ad-slot={variant === "inline" ? "ad-inline" : slot}
      className={cn(
        variant === "rail" && railFrom === "lg"
          ? railFromLg
          : rowClass[variant],
        "bg-surface-alt",
      )}
    >
      <p className="flex min-h-(--ad-label) items-center type-eyebrow text-ink-muted">
        {strings.label}
      </p>
      <div className={cn("flex justify-center", boxClass[variant])}>
        <a
          href={ad.link}
          target="_blank"
          rel="sponsored noopener"
          className="flex max-h-full max-w-full items-center justify-center"
        >
          <picture>
            {sources.map(({ media, size }) => {
              const creative = bySize.get(size);
              return creative ? (
                <source
                  key={size}
                  media={media}
                  srcSet={creative.src}
                  width={creative.width}
                  height={creative.height}
                />
              ) : null;
            })}
            <img
              src={fallbackCreative.src}
              width={fallbackCreative.width}
              height={fallbackCreative.height}
              alt={ad.alt}
              loading={variant === "top" ? "eager" : "lazy"}
              decoding="async"
              className="block max-h-full max-w-full object-contain"
            />
          </picture>
        </a>
      </div>
    </div>
  );
}
