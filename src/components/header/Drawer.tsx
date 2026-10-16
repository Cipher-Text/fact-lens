"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { SocialIcon } from "@/components/footer/SocialIcon";
import { socialLinks } from "@/components/footer/socialLinks";
import { IconButton } from "@/components/story/IconButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { uiLink } from "./classes";
import type { NavItem } from "./navItems";
import { SearchForm } from "./SearchForm";

type Props = {
  items: NavItem[];
  strings: Dictionary["header"];
  footerStrings: Dictionary["footer"];
  siteName: string;
  homeHref: string;
};

/**
 * C-19 Drawer: the menu button and the modal menu from the start edge, at every width. It is
 * the shadcn Sheet with side="left", restyled (CPT-16, DR-228, DR-280), and it opens and
 * closes with the Sheet default slide (no slide with reduced motion). The page behind it is
 * inert and does not scroll. It holds every nav item (DR-255), with the search field first
 * on phones. A category with children is a shadcn Collapsible; all are closed when the
 * Drawer opens, except the current category (DR-181). The social band is pinned to the
 * bottom while the list scrolls. There is no subscribe button (DR-188).
 *
 * Focus moves to the panel itself (tabindex -1), not to an item (DR-249). Escape, the close
 * button and a press on the backdrop close it, and focus returns to the menu button. A link
 * to a place on the page closes the Drawer and moves focus to that place.
 *
 * Base UI hides the page behind the open panel with aria-hidden and traps Tab inside it; it
 * does not set the `inert` attribute that the spec names (R3-02 DOC- item).
 *
 * The panel inset is 20px (px-5) on the panel's wrappers; rows, links and dividers set no
 * side padding of their own (LAY-21, DR-295).
 */
export function Drawer({
  items,
  strings,
  footerStrings,
  siteName,
  homeHref,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Set by a link: the element that gets the focus instead of the menu button.
  const linkTarget = useRef<HTMLElement | null>(null);
  // True when the Drawer gave the target its tabindex, so it takes it off again (DR-330).
  const addedTabIndex = useRef(false);
  const [open, setOpen] = useState(false);

  // The ids of the open accordions. The current category is open when the Drawer opens.
  const initialOpen = useCallback(
    () =>
      items
        .filter((item) => item.children?.some((child) => child.current))
        .map((item) => item.id),
    [items],
  );
  const [openIds, setOpenIds] = useState<string[]>(initialOpen);

  const onOpenChange = (next: boolean) => {
    if (next) {
      linkTarget.current = null;
      setOpenIds(initialOpen());
    }
    setOpen(next);
  };

  const onNavigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const hash = event.currentTarget.hash;
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    addedTabIndex.current = !!target && !target.hasAttribute("tabindex");
    if (target && addedTabIndex.current) target.setAttribute("tabindex", "-1");
    linkTarget.current = target;
    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // A link to a place on the page: focus goes to that place, not to the menu button.
        // Base UI returns focus only to a tabbable element, and the target is tabindex -1.
        // The ref stays set until the next open, so finalFocus still says "do not return".
        const target = linkTarget.current;
        if (isOpen || !target) return;
        target.focus({ preventScroll: true });
        // The target is not a control: it keeps no tabindex once focus has left (DR-330).
        if (addedTabIndex.current)
          target.addEventListener(
            "blur",
            () => target.removeAttribute("tabindex"),
            {
              once: true,
            },
          );
      }}
    >
      <SheetTrigger
        render={
          <IconButton
            variant="ghost"
            icon={Menu}
            label={strings.menu}
            title={strings.menu}
            data-drawer-trigger=""
          />
        }
      />

      <SheetContent
        ref={panelRef}
        aria-label={strings.menu}
        initialFocus={panelRef}
        finalFocus={() => !linkTarget.current}
        data-drawer
        data-drawer-panel
        className="focus-visible:outline-none"
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-5">
          <Link
            href={homeHref}
            onClick={onNavigate}
            aria-label={strings.home}
            className="type-logo-sm whitespace-nowrap text-brand"
            data-logo
          >
            {siteName}
          </Link>
          <SheetClose
            render={
              <IconButton
                variant="ghost"
                icon={X}
                label={strings.closeMenu}
                title={strings.closeMenu}
                className="-me-1.5 md:-me-2"
              />
            }
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
          className="min-h-0 flex-1 overflow-y-auto px-5"
        >
          <ul>
            {items.map((item) => (
              <DrawerItem
                key={item.id}
                item={item}
                expanded={openIds.includes(item.id)}
                onExpandedChange={(expanded) =>
                  setOpenIds((ids) =>
                    expanded
                      ? [...ids, item.id]
                      : ids.filter((id) => id !== item.id),
                  )
                }
                onNavigate={onNavigate}
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
      </SheetContent>
    </Sheet>
  );
}

type ItemProps = {
  item: NavItem;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onNavigate: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  strings: Dictionary["header"];
};

// Drawer.item: type-ui 600, rows min-h-13 (52px), a 1px rule under every category row,
// inside the panel inset. Drawer.accordion: the label links to the category; a 44px caret
// button (ghost, size default) at the end opens the child list below the row. The child group sits on the page
// surface, as wide as the rules, with children indented 16px (DR-185, DR-295).
function DrawerItem({
  item,
  expanded,
  onExpandedChange,
  onNavigate,
  strings,
}: ItemProps) {
  const hasChildren = !!item.children?.length;

  return (
    <li>
      <Collapsible open={expanded} onOpenChange={onExpandedChange}>
        <div className="flex items-center border-b border-border">
          <Link
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
          </Link>
          {hasChildren ? (
            <CollapsibleTrigger
              render={
                <IconButton
                  variant="ghost"
                  size="default"
                  icon={expanded ? ChevronUp : ChevronDown}
                  label={`${item.label}: ${strings.expand}`}
                  className="aria-expanded:text-interactive"
                />
              }
            />
          ) : null}
        </div>
        {hasChildren ? (
          <CollapsibleContent render={<ul className="bg-background py-2" />}>
            {item.children?.map((child) => (
              <li key={child.id}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className="flex min-h-11 items-center ps-4 type-ui-sm text-ink-secondary hover:text-interactive-hover active:text-interactive-pressed"
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    </li>
  );
}
