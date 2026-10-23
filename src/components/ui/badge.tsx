import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Restyled after add (CPT-16): no radius (CPT-05), no shadow or ring (COL-13, COL-15), no
// dark: classes or opacity modifiers (COL-03, COL-08). Type is type-eyebrow, the Badge
// role (typography §7.3), with normal-case: uppercase is for Eyebrow and Chip only
// (DR-216). As a link (render={<a />}) the text changes color only on hover and press
// (COL-06). Used by the wild card article page for its tag links (tajmin, 24 Oct 2026).
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 border px-3 py-1.5 type-eyebrow normal-case transition-colors duration-200",
  {
    variants: {
      variant: {
        outline:
          "border-border text-ink [a]:hover:text-interactive-hover [a]:active:text-interactive-pressed",
        default:
          "border-transparent bg-interactive text-on-interactive [a]:hover:bg-interactive-hover [a]:active:bg-interactive-pressed",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

function Badge({
  className,
  variant = "outline",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
