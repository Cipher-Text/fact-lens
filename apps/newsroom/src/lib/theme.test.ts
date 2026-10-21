import { describe, expect, it } from 'vitest';
import { applyTheme, effectiveTheme, parseChoice, THEME_STORAGE_KEY, themeScript } from './theme';

describe('theme choice', () => {
  it('knows only system, light and dark, and falls back to system', () => {
    expect(['light', 'dark', 'system'].map(parseChoice)).toEqual(['light', 'dark', 'system']);
    for (const bad of [null, undefined, '', 'DARK', 'blue', 5, {}]) expect(parseChoice(bad)).toBe('system');
  });

  it('shows the system theme only when following the system', () => {
    expect(effectiveTheme('system', true)).toBe('dark');
    expect(effectiveTheme('system', false)).toBe('light');
    expect(effectiveTheme('dark', false)).toBe('dark');
    expect(effectiveTheme('light', true)).toBe('light');
  });
});

/** A stand-in for the browser pieces the page script touches. */
function fakeBrowser(opts: { stored?: string | null; systemDark?: boolean; storageThrows?: boolean; noMatchMedia?: boolean }) {
  const classes = new Set<string>();
  const style = { colorScheme: '' };
  const document = {
    documentElement: {
      style,
      classList: { toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)) },
    },
  };
  const localStorage = {
    getItem: (key: string) => {
      if (opts.storageThrows) throw new Error('blocked');
      return key === THEME_STORAGE_KEY ? (opts.stored ?? null) : null;
    },
  };
  const window = opts.noMatchMedia ? {} : { matchMedia: () => ({ matches: !!opts.systemDark }) };
  return { document, localStorage, window, classes, style };
}

function runScript(opts: Parameters<typeof fakeBrowser>[0]) {
  const b = fakeBrowser(opts);
  new Function('document', 'localStorage', 'window', themeScript)(b.document, b.localStorage, b.window);
  return { dark: b.classes.has('dark'), light: b.classes.has('light'), scheme: b.style.colorScheme };
}

describe('the page script that runs before the first paint', () => {
  it('uses the stored choice over the system setting', () => {
    expect(runScript({ stored: 'dark', systemDark: false })).toEqual({ dark: true, light: false, scheme: 'dark' });
    expect(runScript({ stored: 'light', systemDark: true })).toEqual({ dark: false, light: true, scheme: 'light' });
  });

  it('follows the system when nothing is stored', () => {
    expect(runScript({ stored: null, systemDark: true }).dark).toBe(true);
    expect(runScript({ stored: null, systemDark: false }).dark).toBe(false);
  });

  it('ignores a stored value it does not know', () => {
    expect(runScript({ stored: 'purple', systemDark: true }).dark).toBe(true);
    expect(runScript({ stored: 'purple', systemDark: false }).dark).toBe(false);
  });

  it('still works when storage is blocked or the browser cannot report the system setting', () => {
    expect(runScript({ storageThrows: true, systemDark: true }).dark).toBe(true);
    expect(runScript({ noMatchMedia: true, stored: 'dark' }).dark).toBe(true);
    expect(runScript({ noMatchMedia: true, stored: null }).dark).toBe(false);
  });

  it('is the same code the app uses, so the two cannot drift', () => {
    expect(themeScript).toContain(applyTheme.toString());
    expect(themeScript).toContain(JSON.stringify(THEME_STORAGE_KEY));
  });
});
