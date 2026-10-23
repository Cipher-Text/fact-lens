"use client";

import { Link2, Mail, Share2, Upload } from "lucide-react";
import { useSyncExternalStore } from "react";

import { NetworkIcon, type Network } from "./icons";
import { Popover } from "./Popover";
import type { ReaderStrings } from "./strings";
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

function nativeShare(url: string, title: string, summary: string) {
  navigator.share({ title, text: summary, url }).catch(() => {
    // The reader closed the share sheet.
  });
}

/** Round share buttons in a row (hero and end of article) or a column (the rail). */
export function ShareButtons({
  path,
  title,
  summary,
  t,
  layout = "row",
}: ShareProps & { layout?: "row" | "rail" }) {
  const url = useOrigin() + path;
  const canShare = useCanShare();
  const links = targets(url, title);
  const name = (network: Network) =>
    t.shareOn.replace("{network}", t.networks[network]);

  return (
    <ul className={`rd-share rd-share--${layout}`} aria-label={t.shareStory}>
      {networks.map((network) => (
        <li key={network}>
          <a
            className="rd-share__btn"
            data-net={network}
            href={links[network]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name(network)}
            title={name(network)}
          >
            <NetworkIcon network={network} />
          </a>
        </li>
      ))}
      {layout === "row" ? (
        <li>
          <a
            className="rd-share__btn"
            data-net="email"
            href={mailto(url, title, summary)}
            aria-label={t.email}
            title={t.email}
          >
            <Mail aria-hidden="true" />
          </a>
        </li>
      ) : null}
      <li>
        <button
          type="button"
          className="rd-share__btn"
          data-net="copy"
          aria-label={t.copyLink}
          title={t.copyLink}
          onClick={() => copyText(url, t.linkCopied)}
        >
          <Link2 aria-hidden="true" />
        </button>
      </li>
      {canShare && layout === "row" ? (
        <li>
          <button
            type="button"
            className="rd-share__btn"
            data-net="more"
            aria-label={t.shareMore}
            title={t.shareMore}
            onClick={() => nativeShare(url, title, summary)}
          >
            <Upload aria-hidden="true" />
          </button>
        </li>
      ) : null}
    </ul>
  );
}

/** One share button that opens a menu of every target (the bar and the pill). */
export function ShareMenu({
  path,
  title,
  summary,
  t,
  side = "bottom",
  buttonClassName,
}: ShareProps & { side?: "top" | "bottom"; buttonClassName?: string }) {
  const url = useOrigin() + path;
  const canShare = useCanShare();
  const links = targets(url, title);

  return (
    <Popover
      label={t.share}
      icon={<Share2 aria-hidden="true" />}
      side={side}
      buttonClassName={buttonClassName}
    >
      {(close) => (
        <>
          <p className="rd-pop__label">{t.shareStory}</p>
          <ul className="rd-menu">
            {networks.map((network) => (
              <li key={network}>
                <a
                  className="rd-menu__item"
                  data-net={network}
                  href={links[network]}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                >
                  <span className="rd-menu__icon">
                    <NetworkIcon network={network} />
                  </span>
                  {t.networks[network]}
                </a>
              </li>
            ))}
            <li>
              <a
                className="rd-menu__item"
                data-net="email"
                href={mailto(url, title, summary)}
                onClick={close}
              >
                <span className="rd-menu__icon">
                  <Mail aria-hidden="true" />
                </span>
                {t.email}
              </a>
            </li>
            <li>
              <button
                type="button"
                className="rd-menu__item"
                data-net="copy"
                onClick={() => {
                  copyText(url, t.linkCopied);
                  close();
                }}
              >
                <span className="rd-menu__icon">
                  <Link2 aria-hidden="true" />
                </span>
                {t.copyLink}
              </button>
            </li>
            {canShare ? (
              <li>
                <button
                  type="button"
                  className="rd-menu__item"
                  data-net="more"
                  onClick={() => {
                    close();
                    nativeShare(url, title, summary);
                  }}
                >
                  <span className="rd-menu__icon">
                    <Upload aria-hidden="true" />
                  </span>
                  {t.shareMore}
                </button>
              </li>
            ) : null}
          </ul>
        </>
      )}
    </Popover>
  );
}
