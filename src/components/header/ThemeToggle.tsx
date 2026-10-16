"use client";

import { Moon, Sun } from "lucide-react";

import type { Dictionary } from "@/i18n";
import { nextThemeChoice, setThemeChoice } from "@/lib/theme";

import { useThemeChoice } from "./useThemeChoice";

type Props = { strings: Dictionary["theme"] };

/**
 * C-12 ThemeToggle: the theme switch of the top bar, from 768px. Track 56 x 32 in
 * `--color-theme-control` (fill-neutral in light, interactive in dark). Thumb 26 x 26 with
 * a 3px inset (`--switch-thumb-inset`), sliding 24px over 450ms with ease-slide. Track and
 * thumb corners use `--switch-radius`. The thumb is `background`; its 20px icon is the sun at
 * the start (light) or the moon at the end (dark). No hover and no pressed color; the focus
 * outline of the base rule only (DR-211). The tap area is 44px high (the ::after extends
 * it). role switch, aria-checked = dark, name "Dark theme". The one component with rounded
 * corners (CPT-05, DR-168).
 */
export function ThemeToggle({ strings }: Props) {
  const choice = useThemeChoice();
  const dark = choice === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={strings.dark}
      title={strings.dark}
      onClick={() => setThemeChoice(nextThemeChoice(choice))}
      data-theme-toggle={choice}
      className="group relative inline-flex h-8 w-14 shrink-0 items-center rounded-(--switch-radius) bg-(--color-theme-control) after:absolute after:inset-x-0 after:-inset-y-1.5 max-md:hidden md:me-3"
    >
      <span
        aria-hidden="true"
        className="ms-(--switch-thumb-inset) inline-flex size-6.5 items-center justify-center rounded-(--switch-radius) bg-background text-interactive group-aria-checked:translate-x-6 motion-safe:transition-transform motion-safe:duration-450 motion-safe:ease-slide"
      >
        {dark ? (
          <Moon className="size-(--icon-size)" />
        ) : (
          <Sun className="size-(--icon-size)" />
        )}
      </span>
    </button>
  );
}
