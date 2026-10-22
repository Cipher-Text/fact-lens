'use client';

const ID = 'save-announcer';

/**
 * A short "Saved" message in a polite live region, so a change that only refreshes the page still
 * tells the person it worked (and screen readers hear it). Not state: it removes itself.
 */
export function announce(message: string): void {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(ID);
  if (!el) {
    el = document.createElement('div');
    el.id = ID;
    el.setAttribute('role', 'status');
    el.className = 'pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded border border-line bg-panel px-3 py-2 text-sm shadow-lg transition-opacity';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = '1';
  window.clearTimeout(Number(el.dataset.timer));
  el.dataset.timer = String(window.setTimeout(() => { if (el) el.style.opacity = '0'; }, 2500));
}
