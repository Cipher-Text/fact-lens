"use client";

import { Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { NetworkIcon } from "./icons";
import type { ReaderStrings } from "@/i18n";
import { copyText } from "./Toaster";

type Spot = { x: number; y: number; text: string };

const MAX_QUOTE = 280;

/**
 * Select a sentence in the body and a small bar offers to copy it as a quote or to
 * share it. The quote carries the headline and the link.
 */
export function SelectionShare({
  title,
  t,
}: {
  title: string;
  t: ReaderStrings;
}) {
  const [spot, setSpot] = useState<Spot | null>(null);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const selection = document.getSelection();
      const text = selection?.toString().trim() ?? "";
      const body = document.querySelector("[data-reader-body]");
      if (
        !selection ||
        selection.rangeCount === 0 ||
        text.length < 12 ||
        text.length > MAX_QUOTE ||
        !body?.contains(selection.anchorNode) ||
        !body.contains(selection.focusNode)
      ) {
        setSpot(null);
        return;
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const half = 130;
      setSpot({
        x: Math.min(
          window.innerWidth - half,
          Math.max(half, rect.left + rect.width / 2),
        ),
        y: Math.max(76, rect.top - 12),
        text,
      });
    };
    const onChange = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const onScroll = () => setSpot(null);
    document.addEventListener("selectionchange", onChange);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", onChange);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!spot) return null;

  const url = `${window.location.origin}${window.location.pathname}`;
  const quote = `“${spot.text}”\n\n${title}\n${url}`;

  return (
    <div
      className="rd-selbar"
      role="toolbar"
      aria-label={t.quoteShare}
      style={{ left: spot.x, top: spot.y }}
      // Keep the selection when a button is pressed.
      onPointerDown={(event) => event.preventDefault()}
    >
      <button
        type="button"
        onClick={() => copyText(quote, t.quoteCopied, t.copyFailed)}
      >
        <Copy aria-hidden="true" />
        {t.copyQuote}
      </button>
      <a
        href={`https://x.com/intent/post?text=${encodeURIComponent(`“${spot.text}”`)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.shareOn.replace("{network}", t.networks.x)}
      >
        <NetworkIcon network="x" />
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(quote)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.shareOn.replace("{network}", t.networks.whatsapp)}
      >
        <NetworkIcon network="whatsapp" />
      </a>
    </div>
  );
}
