"use client";

import { MoonStar, Sun } from "lucide-react";

import { IconButton } from "@/components/story/IconButton";
import type { Dictionary } from "@/i18n";
import { nextThemeChoice, setThemeChoice } from "@/lib/theme";

import { useThemeChoice } from "./useThemeChoice";

type Props = { strings: Dictionary["theme"] };

/**
 * C-12 ThemeButton: the theme control of the top bar at every width (DR-349). An IconButton
 * ghost: 32 x 32 under 768, 36 x 36 from 768, no fill and no wash. The 20px Lucide icon shows
 * the theme that the press switches to: MoonStar in light, Sun in dark (DR-253, DR-349). The
 * icon is ink in both themes; hover interactive-hover, pressed interactive-pressed; the focus
 * outline of the base rule. role switch, aria-checked = dark, name "Dark theme" (DR-167,
 * DR-171).
 */
export function ThemeButton({ strings }: Props) {
  const choice = useThemeChoice();
  const dark = choice === "dark";

  return (
    <IconButton
      variant="ghost"
      icon={dark ? Sun : MoonStar}
      label={strings.dark}
      title={strings.dark}
      role="switch"
      aria-checked={dark}
      onClick={() => setThemeChoice(nextThemeChoice(choice))}
      data-theme-button={choice}
    />
  );
}
