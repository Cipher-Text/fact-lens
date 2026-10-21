import type { ComponentProps, MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = Omit<ComponentProps<"button">, "children"> & {
  /** primary: interactive fill. text: no fill, for the search clear button. */
  variant?: "primary" | "text";
  /** The button fills its column. */
  fullWidth?: boolean;
  children: ReactNode;
};

/**
 * C-12 Button: one size, 48px, side padding 20px, label in type-button on one line (TYP-09).
 * Square, no border, no shadow. Focus is the base outline (COL-13). Disabled is
 * aria-disabled, so focus stays: pass aria-disabled and the click does nothing.
 * The busy state and the icon after the label wait for the pages that need them.
 */
export function Button({
  variant = "primary",
  fullWidth = false,
  type = "button",
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const guard = (event: MouseEvent<HTMLButtonElement>) => {
    if (rest["aria-disabled"] === true || rest["aria-disabled"] === "true") {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      type={type}
      data-button={variant}
      onClick={guard}
      className={cn(
        "inline-flex items-center justify-center gap-x-(--button-icon-gap) type-button whitespace-nowrap transition-colors aria-disabled:cursor-not-allowed",
        variant === "primary"
          ? "min-h-(--button-height) bg-interactive px-(--button-padding) text-on-interactive not-aria-disabled:hover:bg-interactive-hover not-aria-disabled:active:bg-interactive-pressed aria-disabled:bg-surface-alt aria-disabled:text-ink-disabled"
          : "min-h-11 px-3.5 text-ink-secondary not-aria-disabled:hover:text-interactive-hover not-aria-disabled:active:text-interactive-pressed aria-disabled:text-ink-disabled",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  );
}
