"use client";

import { useEffect } from "react";

type Props = { shortId: string; locale: string };

function randomSessionId() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function sessionId() {
  try {
    const existing = sessionStorage.getItem("fl-session");
    if (existing && /^[A-Za-z0-9_-]{32}$/.test(existing)) return existing;
    const value = randomSessionId();
    sessionStorage.setItem("fl-session", value);
    return value;
  } catch {
    return randomSessionId();
  }
}

export function ViewBeacon({ shortId, locale }: Props) {
  useEffect(() => {
    const id = sessionId();
    const apiLocale = locale === "bn" ? "bn-BD" : locale;
    void fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shortId, locale: apiLocale, sessionId: id, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [shortId, locale]);

  return null;
}
