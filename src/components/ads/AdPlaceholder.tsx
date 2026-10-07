import { cn } from "@/lib/utils";

type AdPlaceholderProps = {
  /** Sets the creative width, for example "w-(--ad-band-width)". */
  className?: string;
  text: string;
};

/**
 * A stand-in creative for the prototype (DR-01). It fills the reserved height, uses the
 * creative width and never goes wider than the ad row. Neutral look (U-02).
 */
export function AdPlaceholder({ className, text }: AdPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full max-w-full items-center justify-center border border-dashed border-border bg-surface type-ui-sm text-ink-muted",
        className,
      )}
    >
      {text}
    </div>
  );
}
