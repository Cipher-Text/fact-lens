"use client";

import { useSyncExternalStore } from "react";

// Temporary page only (FL-02). Shows the live value of a CSS custom property,
// so it can be compared with color-system.md Section 2 in each theme.

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const getServerValue = () => "";

export function TokenValue({ name }: { name: string }) {
  const value = useSyncExternalStore(
    subscribe,
    () =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    getServerValue,
  );
  return (
    <code lang="en" className="type-metadata text-ink-muted">
      {value}
    </code>
  );
}
