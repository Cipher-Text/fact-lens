type Props = { label: string };

/**
 * C-17 SkipLink: the first focusable element of the page, before the top ad band. Hidden
 * until it gets focus, then shown at the page start with the base focus outline. The target
 * is `<main id="main" tabindex="-1">`, so Safari moves focus too. `scroll-padding-top`
 * keeps the sticky bar off the target (DR-269).
 */
export function SkipLink({ label }: Props) {
  return (
    <a
      href="#main"
      data-skip-link
      className="sr-only focus:not-sr-only focus:fixed focus:start-(--gutter-page) focus:top-2 focus:z-(--z-overlay) focus:bg-background focus:px-4 focus:py-3 focus:type-ui focus:font-semibold focus:text-ink"
    >
      {label}
    </a>
  );
}
