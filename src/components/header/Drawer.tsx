"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

import { SocialIcon } from "@/components/footer/SocialIcon";
import { socialLinks } from "@/components/footer/socialLinks";
import { IconButton } from "@/components/story/IconButton";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { uiLink } from "./classes";
import type { NavItem } from "./navItems";
import { SearchForm } from "./SearchForm";
import { useModalDialog } from "./useModalDialog";

type Props = {
  items: NavItem[];
  strings: Dictionary["header"];
  footerStrings: Dictionary["footer"];
  siteName: string;
  homeHref: string;
};

const PANEL = "[data-drawer-panel]";

/**
 * C-19 Drawer: the menu button and the modal menu from the start edge, at every width.
 * It holds every nav item (DR-255), with the search field first on phones. A category with
 * children is an accordion; all are closed when the Drawer opens, except the current
 * category (DR-181). The social band is pinned to the bottom while the list scrolls.
 * There is no subscribe button (DR-188).
 *
 * Focus moves to the panel itself (tabindex -1), not to an item (DR-249). It slides in over
 * 450ms with ease-slide; reduced motion removes the slide (globals.css). Escape, the close
 * button and a press on the backdrop close it, and focus returns to the menu button.
 *
 * Built on the native <dialog> instead of the shadcn Sheet and Collapsible (CPT-16):
 * showModal() gives the inert page, Escape and the top layer. A flag for tajmin is in the
 * R2-05 handover.
 */
export function Drawer({
  items,
  strings,
  footerStrings,
  siteName,
  homeHref,
}: Props) {
  const getInitialFocus = useCallback(
    (dialog: HTMLDialogElement) => dialog.querySelector<HTMLElement>(PANEL),
    [],
  );
  const { dialogRef, triggerRef, open, close, closeForLink, onDialogClick } =
    useModalDialog(getInitialFocus);

  // The ids of the open accordions. The current category is open when the Drawer opens.
  const initialOpen = useCallback(
    () =>
      items
        .filter((item) => item.children?.some((child) => child.current))
        .map((item) => item.id),
    [items],
  );
  const [openIds, setOpenIds] = useState<string[]>(initialOpen);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const reset = () => setOpenIds(initialOpen());
    dialog.addEventListener("close", reset);
    return () => dialog.removeEventListener("close", reset);
  }, [dialogRef, initialOpen]);

  return (
    <>
      <IconButton
        ref={triggerRef}
        variant="ghost"
        size="bar"
        icon={Menu}
        label={strings.menu}
        title={strings.menu}
        aria-haspopup="dialog"
        onClick={open}
        className="md:size-(--icon-button-size)"
        data-drawer-trigger=""
      />

      <dialog
        ref={dialogRef}
        aria-label={strings.menu}
        onClick={onDialogClick}
        data-drawer
        className="m-0 h-full max-h-none w-(--drawer-width) max-w-none bg-surface-elevated p-0 text-ink backdrop:bg-overlay motion-safe:transition-transform motion-safe:duration-450 motion-safe:ease-slide starting:open:-translate-x-full"
      >
        <div
          tabIndex={-1}
          data-drawer-panel
          className="flex h-full flex-col focus-visible:outline-none"
        >
          <div className="flex h-14 shrink-0 items-center justify-between ps-5 pe-3.5 md:pe-2">
            <Link
              href={homeHref}
              onClick={closeForLink}
              aria-label={strings.home}
              className="type-section-title whitespace-nowrap text-brand"
              data-logo
            >
              {siteName}
            </Link>
            <IconButton
              variant="ghost"
              size="bar"
              icon={X}
              label={strings.closeMenu}
              title={strings.closeMenu}
              onClick={close}
              className="md:size-(--icon-button-size)"
            />
          </div>

          <div className="shrink-0 px-5 pb-4 md:hidden">
            <SearchForm
              strings={strings}
              size="drawer"
              fieldProps={{ "data-drawer-search": "" }}
            />
          </div>

          <nav
            aria-label={strings.drawerNav}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <ul>
              {items.map((item) => (
                <DrawerItem
                  key={item.id}
                  item={item}
                  expanded={openIds.includes(item.id)}
                  onToggle={() =>
                    setOpenIds((ids) =>
                      ids.includes(item.id)
                        ? ids.filter((id) => id !== item.id)
                        : [...ids, item.id],
                    )
                  }
                  onNavigate={closeForLink}
                  strings={strings}
                />
              ))}
            </ul>
          </nav>

          <ul
            aria-label={footerStrings.social}
            className="flex shrink-0 justify-center gap-2 bg-surface-alt px-5 py-3"
          >
            {socialLinks.map(({ network, href }) => (
              <li key={network}>
                <a
                  href={href}
                  aria-label={footerStrings[network]}
                  data-social={network}
                  className="inline-flex size-(--icon-button-size) items-center justify-center text-ink hover:text-interactive-hover active:text-interactive-pressed"
                >
                  <SocialIcon network={network} className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

type ItemProps = {
  item: NavItem;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  strings: Dictionary["header"];
};

// Drawer.item: type-ui 600, rows min-h-13 (52px), a 1px rule under every category row.
// Drawer.accordion: the label links to the category; a 44px caret button at the end opens
// the child list below the row. The child group runs to the panel edges on the page surface.
function DrawerItem({
  item,
  expanded,
  onToggle,
  onNavigate,
  strings,
}: ItemProps) {
  const listId = useId();
  const hasChildren = !!item.children?.length;

  return (
    <li>
      <div className="flex items-center border-b border-border ps-5 pe-2">
        <a
          href={item.href}
          onClick={onNavigate}
          aria-current={item.current ? "page" : undefined}
          data-drawer-item
          className={cn(
            "flex min-h-13 flex-1 items-center type-ui font-semibold",
            uiLink,
          )}
        >
          {item.label}
        </a>
        {hasChildren ? (
          <IconButton
            variant="ghost"
            icon={expanded ? ChevronUp : ChevronDown}
            label={`${item.label}: ${strings.expand}`}
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={onToggle}
            className="aria-expanded:text-interactive"
          />
        ) : null}
      </div>
      {hasChildren ? (
        <ul id={listId} hidden={!expanded} className="bg-background py-2">
          {item.children?.map((child) => (
            <li key={child.id}>
              <a
                href={child.href}
                onClick={onNavigate}
                className="flex min-h-11 items-center ps-9 pe-5 type-ui-sm text-ink-secondary hover:text-interactive-hover active:text-interactive-pressed"
              >
                {child.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
