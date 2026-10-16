import { cn } from "@/lib/utils";

/**
 * The quote mark of an OpinionList item (C-06): two filled marks, drawn, brand in light and
 * interactive in dark (--color-bar), aria-hidden. The viewBox is 44 x 36, so the height
 * follows the width: 28 x 23 on phones, 36 x 29 from 600px, 44 x 36 from 1024px
 * (--quote-mark-width, which also sets where the OpinionList item rule starts).
 */
export function QuoteMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      data-quote-mark
      viewBox="0 0 44 36"
      fill="currentColor"
      className={cn(
        "h-auto w-(--quote-mark-width) shrink-0 text-(--color-bar)",
        className,
      )}
    >
      <path d="M0 36V20C0 9 6 2 17 0v6C11 8 9 12 9 17h8v19z" />
      <path d="M24 36V20C24 9 30 2 41 0v6c-6 2-8 6-8 11h8v19z" />
    </svg>
  );
}
