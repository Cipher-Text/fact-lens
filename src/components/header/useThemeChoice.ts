"use client";

import { useSyncExternalStore } from "react";

import {
  THEME_CHANGE_EVENT,
  applyTheme,
  THEME_STORAGE_KEY,
  readThemeChoice,
  type ThemeChoice,
} from "@/lib/theme";

function subscribe(onChange: () => void) {
  // Another tab changed the choice (the storage event): apply it here too (DR-340).
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    applyTheme(readThemeChoice());
    onChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// The server does not know the stored choice, so it renders light, the first state.
const getServerChoice = (): ThemeChoice => "light";

/** The reader's stored theme choice, for ThemeToggle and ThemeButton. */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, readThemeChoice, getServerChoice);
}
