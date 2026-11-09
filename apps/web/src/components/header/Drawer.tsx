"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { SocialIcon } from "@/components/footer/SocialIcon";
import { socialLinks, type SocialLink } from "@/components/footer/socialLinks";
import { Divider } from "@/components/layout/Divider";
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
  /** The social links to show; the default is the placeholder list. */
  social?: SocialLink[];
};

/**
 * C-19 Drawer: the menu button and the modal menu from the start edge, at every width. It is
 * the shadcn Sheet with side="left", restyled (CPT-16, DR-228, DR-280), and it opens and
 * closes with a slide from the start edge, --duration-slide ease-slide (DR-346; no slide with reduced
 * motion). The page behind it is
 * inert and does not scroll. It holds every nav item (DR-255), with the search field first
 * on phones. A category with children is a shadcn Collapsible: the child group opens with a
 * height animation and the caret turns, --duration-slide ease-slide (DR-349). All are closed when the
 * Drawer opens, except the current category (DR-181). The social band is pinned to the
 * bottom while the list scrolls. There is no subscribe button (DR-188).
 *
 * Focus moves to the panel itself (tabindex -1), not to an item (DR-249). Escape, the close
 * button and a press on the backdrop close it, and focus returns to the menu button. A link
 * closes the Drawer; every nav item goes to a page (no # link, so no focus to a place on
 * the page; tajmin, 4 Nov 2026).
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
  social = socialLinks,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
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
    if (next) setOpenIds(initialOpen());
    setOpen(next);
  };

  // A link closes the Drawer; the page it opens takes over.
  const onNavigate = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
          {social.map(({ network, href }) => (
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
  onNavigate: () => void;
  strings: Dictionary["header"];
};

// Drawer.item: text-sm 600, rows min-h-13 (52px), a 1px rule under every category row,
// inside the panel inset. Drawer.accordion: the label links to the category; a 44px caret
// button (ghost, size default) at the end opens the child list below the row; the caret
// points down and turns up when the group is open (accordion-caret). The child group sits on the page
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
        <div className="flex items-center">
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={item.current ? "page" : undefined}
            data-drawer-item
            className={cn(
              "flex min-h-13 flex-1 items-center font-ui text-sm font-semibold",
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
                  icon={ChevronDown}
                  label={`${item.label}: ${strings.expand}`}
                  className="accordion-caret aria-expanded:text-interactive"
                />
              }
            />
          ) : null}
        </div>
        {/* The row line: Divider.rule in the soft border color (C-19, C-22; IMP-100). */}
        <Divider variant="rule" tone="soft" />
        {hasChildren ? (
          <CollapsibleContent className="accordion-panel">
            <ul className="bg-background py-2">
              {item.children?.map((child) => (
                <li key={child.id}>
                  <Link
                    href={child.href}
                    onClick={onNavigate}
                    aria-current={child.current ? "page" : undefined}
                    className="flex min-h-11 items-center ps-4 font-ui text-xs font-medium text-ink-secondary hover:text-interactive-hover active:text-interactive-pressed aria-[current=page]:text-interactive"
                  >
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    </li>
  );
}
