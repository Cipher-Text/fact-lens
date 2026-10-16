"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

import { IconButton } from "@/components/story/IconButton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { Dictionary } from "@/i18n";

import { SearchForm } from "./SearchForm";

type Props = {
  strings: Dictionary["header"];
  trendingTerms: string[];
};

/**
 * C-20 SearchDialog: the search button in the top bar and the modal search panel, from
 * 768px (DR-21). Below 768px the bar has no search button; search is in the Drawer. The
 * panel is the shadcn Drawer from the top, restyled (CPT-16, DR-280): full width at the top
 * on surface-elevated with the overlay behind it, 96px above and 56px below the content, and
 * the content in the shell (DR-190). It opens and closes with the shadcn slide; with
 * reduced motion there is no slide.
 *
 * Focus moves to the panel itself (tabindex -1, no visible ring), as in the Drawer; one Tab
 * reaches the field (DR-249). Escape, the close button and a press on the backdrop close
 * it, and focus returns to the search button. The page behind it is inert.
 */
export function SearchDialog({ strings, trendingTerms }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <Drawer swipeDirection="up">
      <DrawerTrigger
        render={
          <IconButton
            variant="ghost"
            icon={Search}
            label={strings.search}
            title={strings.search}
            className="max-md:hidden"
            data-search-trigger=""
          />
        }
      />

      <DrawerContent
        ref={panelRef}
        aria-label={strings.search}
        initialFocus={panelRef}
        data-search-dialog
        className="inset-x-0 top-0 focus-visible:outline-none"
      >
        <div className="relative">
          <div className="shell pt-24 pb-14">
            <SearchForm
              strings={strings}
              size="dialog"
              fieldProps={{ "data-search-field": "" }}
              trendingTerms={trendingTerms}
            />
          </div>
          {/* After the field in the source order, so one Tab from the panel reaches the
              field (DR-249). It is placed in the top corner by position (DR-186, DR-189). */}
          <DrawerClose
            render={
              <IconButton
                variant="ghost"
                icon={X}
                label={strings.closeSearch}
                title={strings.closeSearch}
                className="absolute end-(--top-bar-inset) top-3"
              />
            }
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
