"use client";

import { Moon, Sun } from "lucide-react";

import type { Dictionary } from "@/i18n";
import { nextThemeChoice, setThemeChoice } from "@/lib/theme";

import { useThemeChoice } from "./useThemeChoice";

type Props = { strings: Dictionary["theme"] };

/**
 * C-12 ThemeButton: the theme control of the phone top bar (under 768px). A 32 x 32 square
 * tap with no tile and no fill. The 20px Lucide icon shows the theme that the press
 * switches to: moon in light, sun in dark (DR-167, DR-253, DR-301). The icon is
 * `interactive` (see the UNRESOLVED_DESIGN_SYSTEM item in R3-02). No hover and no pressed
 * color; the focus outline of the base rule only (DR-211). role switch, aria-checked =
 * dark (DR-171).
 */
export function ThemeButton({ strings }: Props) {
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
      data-theme-button={choice}
      className="inline-flex size-(--icon-button-size-bar) items-center justify-center text-interactive md:hidden"
    >
      {dark ? (
        <Sun aria-hidden="true" className="size-(--icon-size)" />
      ) : (
        <Moon aria-hidden="true" className="size-(--icon-size)" />
      )}
    </button>
  );
}
