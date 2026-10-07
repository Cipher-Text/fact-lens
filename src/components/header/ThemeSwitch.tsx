"use client";

import { useSyncExternalStore } from "react";

import type { Dictionary } from "@/i18n";
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  readThemeChoice,
  setThemeChoice,
  type ThemeChoice,
} from "@/lib/theme";

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// The server does not know the stored choice, so it renders "system".
const getServerChoice = (): ThemeChoice => "system";

type Props = { strings: Dictionary["theme"] };

// Three-state theme switch (spacing-layout-system.md Section 6).
// Neutral treatment until the header is designed (U-02).
export function ThemeSwitch({ strings }: Props) {
  const choice = useSyncExternalStore(
    subscribe,
    readThemeChoice,
    getServerChoice,
  );

  const options: { value: ThemeChoice; label: string }[] = [
    { value: "system", label: strings.optionSystem },
    { value: "light", label: strings.optionLight },
    { value: "dark", label: strings.optionDark },
  ];

  return (
    <div
      role="group"
      aria-label={strings.label}
      className="inline-flex border border-border-interactive"
    >
      {options.map((option) => {
        const pressed = choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => setThemeChoice(option.value)}
            className={
              "px-3 py-2 type-button focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none " +
              (pressed
                ? "bg-interactive text-on-interactive"
                : "text-interactive hover:text-interactive-hover active:text-interactive-pressed")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
