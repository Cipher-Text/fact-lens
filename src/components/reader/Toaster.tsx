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

/**
 * Copies text to the clipboard and says whether it worked. Falls back to a hidden
 * textarea; focus goes back to where it was after the fallback.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const focused = document.activeElement;
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
    if (focused instanceof HTMLElement) focused.focus();
    return copied;
  }
}

/** Copies text and says so with a toast: the confirmation, or the failure message. */
export async function copyText(
  text: string,
  confirm: string,
  failed: string,
): Promise<boolean> {
  const copied = await writeClipboard(text);
  toast(copied ? confirm : failed);
  return copied;
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
