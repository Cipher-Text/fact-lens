"use client";

import { useSyncExternalStore } from "react";

import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  readThemeChoice,
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

/** The reader's stored theme choice, for ThemeToggle. */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, readThemeChoice, getServerChoice);
}
