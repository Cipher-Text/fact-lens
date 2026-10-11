"use client";

import { Moon, Sun } from "lucide-react";

import type { Dictionary } from "@/i18n";
import { nextThemeChoice, setThemeChoice } from "@/lib/theme";

import { useThemeChoice } from "./useThemeChoice";

type Props = { strings: Dictionary["theme"] };

/**
 * C-12 ThemeButton: the theme control of the phone top bar (under 768px). A 32 x 32 square
 * tap with no tile and no fill. The 20px icon shows the theme that the press switches to:
 * moon in light, sun in dark (DR-167, DR-253). The icon is `interactive` in light and `ink`
 * in dark (DR-211, --color-theme-control). No hover and no pressed color; the focus outline
 * of the base rule only. role switch, aria-checked = dark (DR-171).
 * The moon sits 1px above the box center, where its weight looks centered (DR-177).
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
      className="inline-flex size-(--icon-button-size-bar) items-center justify-center text-(--color-theme-control) md:hidden"
    >
      {dark ? (
        <Sun aria-hidden="true" className="size-5" />
      ) : (
        <Moon aria-hidden="true" className="size-5 -translate-y-px" />
      )}
    </button>
  );
}
