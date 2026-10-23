"use client";

import { Check, Copy, Link2, Mail, Share2, Upload } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { NetworkIcon, type Network } from "./icons";
import type { ReaderStrings } from "@/i18n";
import { copyText } from "./Toaster";

// The public site, for the server render. In the browser the links use the page origin.
const SITE_ORIGIN = "https://fact-lens-web-ashy.vercel.app";

const noop = () => () => {};

function useOrigin(): string {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => SITE_ORIGIN,
  );
}

function useCanShare(): boolean {
  return useSyncExternalStore(
    noop,
    () => typeof navigator.share === "function",
    () => false,
  );
}

export type ShareProps = {
  path: string;
  title: string;
  summary: string;
  t: ReaderStrings;
};

const networks: Network[] = [
  "whatsapp",
  "facebook",
  "x",
  "linkedin",
  "telegram",
];

function targets(url: string, title: string): Record<Network, string> {
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://x.com/intent/post?text=${text}&url=${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${text}`,
  };
}

function mailto(url: string, title: string, summary: string) {
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${summary}\n\n${url}`)}`;
}

/** An icon button that copies the story link, for the left panel. */
export function CopyLinkButton({
  path,
  t,
}: {
  path: string;
  t: ReaderStrings;
}) {
  const url = useOrigin() + path;
  return (
    <button
      type="button"
      className="rd-iconbtn"
      aria-label={t.copyLink}
      title={t.copyLink}
      onClick={() => copyText(url, t.linkCopied)}
    >
      <Link2 aria-hidden="true" />
    </button>
  );
}

/**
 * The one share control. Every share place on the page (bar, hero, panel, end of the
 * article) is this icon button; it opens a shadcn Dialog with every share option and the
 * link.
 */
export function ShareDialog({ path, title, summary, t }: ShareProps) {
  const url = useOrigin() + path;
  const canShare = useCanShare();
  const links = targets(url, title);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    copyText(url, t.linkCopied);
    setCopied(true);
  };

  return (
    <Dialog onOpenChange={(open) => open || setCopied(false)}>
      <DialogTrigger
        className="rd-iconbtn"
        aria-label={t.share}
        title={t.share}
      >
        <Share2 aria-hidden="true" />
      </DialogTrigger>
      <DialogContent closeLabel={t.close} className="rd-sharedlg gap-6 p-6">
        <DialogHeader>
          <DialogTitle>{t.shareStory}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <ul className="rd-sharedlg__grid" aria-label={t.shareStory}>
          {networks.map((network) => (
            <li key={network}>
              <a
                className="rd-sharedlg__option type-ui-sm text-ink"
                href={links[network]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="rd-sharedlg__icon">
                  <NetworkIcon network={network} />
                </span>
                {t.networks[network]}
              </a>
            </li>
          ))}
          <li>
            <a
              className="rd-sharedlg__option type-ui-sm text-ink"
              href={mailto(url, title, summary)}
            >
              <span className="rd-sharedlg__icon">
                <Mail aria-hidden="true" />
              </span>
              {t.email}
            </a>
          </li>
          {canShare ? (
            <li>
              <button
                type="button"
                className="rd-sharedlg__option type-ui-sm text-ink"
                onClick={() =>
                  navigator.share({ title, text: summary, url }).catch(() => {
                    // The reader closed the share sheet.
                  })
                }
              >
                <span className="rd-sharedlg__icon">
                  <Upload aria-hidden="true" />
                </span>
                {t.shareMore}
              </button>
            </li>
          ) : null}
        </ul>

        <div className="rd-sharedlg__link">
          <label className="sr-only" htmlFor="rd-share-url">
            {t.copyLink}
          </label>
          <input
            id="rd-share-url"
            className="rd-sharedlg__field type-input text-ink"
            value={url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            className="rd-sharedlg__copy bg-interactive type-button text-on-interactive hover:bg-interactive-hover"
            onClick={copy}
          >
            {copied ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
