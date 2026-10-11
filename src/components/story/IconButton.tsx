import type { LucideIcon } from "lucide-react";
import type { ComponentProps, MouseEvent } from "react";

import { cn } from "@/lib/utils";

type IconButtonProps = Omit<
  ComponentProps<"button">,
  "children" | "aria-label"
> & {
  /** The accessible name, in the page language. */
  label: string;
  icon: LucideIcon;
  /** filled: the slider and attached submit buttons. ghost: the TopBar and dialogs. */
  variant?: "filled" | "ghost";
  /** 44 (default), bar 32 (phone TopBar and Drawer header), field (fills the inner height of its field). */
  size?: "default" | "bar" | "field";
};

const sizes = {
  default: "size-(--icon-button-size)",
  bar: "size-(--icon-button-size-bar)",
  field: "h-full aspect-square",
} as const;

/**
 * C-12 IconButton: a square icon-only button, 20px Lucide icon, no border, no shadow.
 * Disabled is aria-disabled, so focus stays: pass aria-disabled and the click does nothing.
 * filled: interactive fill, at an end surface-alt with ink-disabled. ghost: no fill; hover
 * accent-subtle wash with an interactive icon; pressed accent-soft.
 */
export function IconButton({
  label,
  icon: Icon,
  variant = "filled",
  size = "default",
  type = "button",
  className,
  onClick,
  ...rest
}: IconButtonProps) {
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
      aria-label={label}
      data-icon-button={variant}
      onClick={guard}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors aria-disabled:cursor-not-allowed",
        sizes[size],
        variant === "filled"
          ? "bg-interactive text-on-interactive not-aria-disabled:hover:bg-interactive-hover not-aria-disabled:active:bg-interactive-pressed aria-disabled:bg-surface-alt aria-disabled:text-ink-disabled"
          : "text-ink not-aria-disabled:hover:bg-accent-subtle not-aria-disabled:hover:text-interactive not-aria-disabled:active:bg-accent-soft aria-disabled:text-ink-disabled",
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
