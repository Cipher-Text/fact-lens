"use client";

import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";

// One short message at a time, for copy and save feedback. The text stays while the
// toast fades out.
let message = { text: "", visible: false };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  listeners.forEach((listener) => listener());
}

export function toast(text: string) {
  message = { text, visible: true };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    message = { ...message, visible: false };
    emit();
  }, 2400);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const hidden = { text: "", visible: false };

/** Copies text and confirms with a toast. Falls back to a hidden textarea. */
export async function copyText(text: string, confirm: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  toast(confirm);
}

export function Toaster() {
  const current = useSyncExternalStore(
    subscribe,
    () => message,
    () => hidden,
  );
  return (
    <div
      className="rd-toast"
      role="status"
      aria-live="polite"
      data-show={current.visible ? "" : undefined}
    >
      {current.text ? <Check aria-hidden="true" /> : null}
      <span>{current.text}</span>
    </div>
  );
}
