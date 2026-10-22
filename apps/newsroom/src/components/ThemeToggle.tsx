'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  applyTheme, parseChoice, readChoice, setChoice, systemPrefersDark, THEME_CHANGE_EVENT, themeChoices, type ThemeChoice,
} from '@/lib/theme';

const labels: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' };

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

/** Choose System, Light or Dark. The choice is remembered in this browser. */
export function ThemeToggle() {
  // The server cannot know the choice; "system" renders first and the real value follows at once.
  const choice = useSyncExternalStore(subscribe, readChoice, () => 'system' as ThemeChoice);

  // While following the system, follow it live when it changes (for example at sunset).
  useEffect(() => {
    if (choice !== 'system' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system', systemPrefersDark());
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [choice]);

  return (
    <select aria-label="Theme" value={choice} onChange={(e) => setChoice(parseChoice(e.target.value))}
      className="rounded-lg border border-line bg-panel px-2 py-1.5 text-sm">
      {themeChoices.map((c) => <option key={c} value={c}>{labels[c]}</option>)}
    </select>
  );
}
