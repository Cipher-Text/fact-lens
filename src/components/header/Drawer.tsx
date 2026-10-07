"use client";

import { Menu, X } from "lucide-react";
import { useCallback } from "react";

import type { Dictionary } from "@/i18n";

import {
  filledButton,
  focusRingElevated,
  iconButton,
  iconButtonElevated,
  navLinkElevated,
} from "./classes";
import type { NavItem } from "./navItems";
import { SearchForm } from "./SearchForm";
import { firstVisible, useModalDialog } from "./useModalDialog";

type Props = {
  items: NavItem[];
  strings: Dictionary["header"];
};

const ITEM = "[data-drawer-item]";

/**
 * The menu button and the drawer (spacing-layout-system.md Section 6, DR-41).
 * The drawer opens from the left at all widths and holds every nav item.
 * Phones: search is the first item and Subscribe the last (DR-21, DR-43).
 * Focus moves to the first item. With reduced motion there is no slide.
 */
export function Drawer({ items, strings }: Props) {
  const getInitialFocus = useCallback(
    (dialog: HTMLDialogElement) => firstVisible(dialog, ITEM),
    [],
  );
  const { dialogRef, triggerRef, open, close, closeForLink, onDialogClick } =
    useModalDialog(getInitialFocus);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={strings.menu}
        title={strings.menu}
        className={iconButton}
      >
        <Menu aria-hidden="true" className="size-6" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={strings.menu}
        onClick={onDialogClick}
        data-drawer
        className="m-0 h-full max-h-none w-(--drawer-width) max-w-none bg-surface-elevated text-ink backdrop:bg-overlay motion-safe:transition-transform motion-safe:duration-200 starting:open:-translate-x-full"
      >
        <div className="flex min-h-full flex-col gap-(--space-module) px-(--gutter-page) pb-(--space-module)">
          <div className="flex min-h-(--bar-height) items-center justify-end">
            <button
              type="button"
              onClick={close}
              aria-label={strings.closeMenu}
              title={strings.closeMenu}
              className={iconButtonElevated}
            >
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="md:hidden">
            <SearchForm
              strings={strings}
              fieldProps={{ "data-drawer-item": "" }}
            />
          </div>

          <nav aria-label={strings.drawerNav}>
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.id} className="border-b border-border-soft">
                  <a
                    href={item.href}
                    onClick={closeForLink}
                    data-drawer-item
                    className={drawerLink("type-ui font-semibold")}
                  >
                    {item.label}
                  </a>
                  {item.children ? (
                    <ul className="flex flex-col ps-4 pb-2">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <a
                            href={child.href}
                            onClick={closeForLink}
                            className={drawerLink("type-ui-sm")}
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <a
            href="#newsletter"
            onClick={closeForLink}
            className={`${filledButton} ${focusRingElevated} self-start md:hidden`}
          >
            {strings.subscribe}
          </a>
        </div>
      </dialog>
    </>
  );
}

// Drawer roles: type-ui 600 for items, type-ui-sm 500 for sub-items
// (typography-system.md Section 7.4). The focus ring offset uses the drawer surface.
function drawerLink(role: string) {
  return `flex min-h-11 items-center ${role} ${navLinkElevated}`;
}
