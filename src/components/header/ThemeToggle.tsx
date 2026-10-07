"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import type { Dictionary } from "@/i18n";
import { nextThemeChoice, setThemeChoice, type ThemeChoice } from "@/lib/theme";

import { iconButton } from "./classes";
import { useThemeChoice } from "./useThemeChoice";

const icons = { system: Monitor, light: Sun, dark: Moon } as const;

type Props = { strings: Dictionary["theme"] };

/**
 * One icon button for the top bar. Each press moves to the next state: system, light,
 * dark (spacing-layout-system.md Section 6). The three-button ThemeSwitch does not fit
 * the phone bar beside the logo. The name gives the current state in the page language.
 * Neutral treatment (U-04).
 */
export function ThemeToggle({ strings }: Props) {
  const choice = useThemeChoice();
  const Icon = icons[choice];
  const names: Record<ThemeChoice, string> = {
    system: strings.optionSystem,
    light: strings.optionLight,
    dark: strings.optionDark,
  };
  const name = `${strings.label}: ${names[choice]}`;

  return (
    <button
      type="button"
      onClick={() => setThemeChoice(nextThemeChoice(choice))}
      aria-label={name}
      title={name}
      data-theme-toggle={choice}
      className={iconButton}
    >
      <Icon aria-hidden="true" className="size-6" />
    </button>
  );
}
