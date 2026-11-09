// Reader text size on the article page (TYP-15): three steps, 0 default, 1 lg, 2 xl
// (the typography tokens: --reader-scale 1, 1.2 and 1.4). Kept per reader in local storage.

const SIZE_KEY = "rd-text-size";

/** A stored value as a size step, or null when it is missing or not a step. */
export function parseReaderSize(stored: string | null): number | null {
  return stored === "0" || stored === "1" || stored === "2"
    ? Number(stored)
    : null;
}

export function readStoredSize(): number | null {
  try {
    return parseReaderSize(window.localStorage.getItem(SIZE_KEY));
  } catch {
    return null;
  }
}

export function storeReaderSize(size: number) {
  try {
    window.localStorage.setItem(SIZE_KEY, String(size));
  } catch {
    // Storage can be blocked; the size then lasts for this page only.
  }
}

/**
 * Sets the reader size on <html>. It must not use anything outside its body, because
 * readerSizeScript inlines its source and runs it before the first paint.
 */
export function applyReaderSize(size: number | null) {
  const value = size === 1 ? "lg" : size === 2 ? "xl" : null;
  const root = document.documentElement;
  if (value) root.setAttribute("data-reader-size", value);
  else root.removeAttribute("data-reader-size");
}

/**
 * True for an article path: /story/<slug>-<id> and /en/story/<slug>-<id> (layout 7C).
 * It must not use anything outside its body, because readerSizeScript inlines it.
 */
export function isArticlePath(path: string) {
  return /^(\/en)?\/story\//.test(path);
}

/**
 * Inline script for the root layout <head>. It runs before the body renders, so a stored
 * size shows on the first paint of an article and the text does not re-flow after
 * hydration. The layout renders it once: React never creates it on the client, where a
 * script does not run (a client link to an article). ReaderRoot sets the size there.
 */
export const readerSizeScript = `(function () {
  var isArticle = ${isArticlePath.toString()};
  if (!isArticle(location.pathname)) return;
  var apply = ${applyReaderSize.toString()};
  var stored = null;
  try { stored = Number(localStorage.getItem(${JSON.stringify(SIZE_KEY)})); } catch (e) {}
  apply(stored);
})();`;
