"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";

import { cn } from "@/lib/utils";

// Restyled after add (CPT-16, DR-280): only the top panel of the SearchDialog is kept, with
// no snap points, no nested stack and no swipe handle. Swiping up still closes it.
function Drawer({
  swipeDirection = "up",
  ...props
}: DrawerPrimitive.Root.Props) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      swipeDirection={swipeDirection}
      {...props}
    />
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPrimitive.Portal data-slot="drawer-portal">
      <DrawerPrimitive.Backdrop
        data-slot="drawer-overlay"
        className="fixed inset-0 z-(--z-overlay) min-h-dvh bg-overlay drawer-overlay"
      />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className="fixed inset-0 z-(--z-overlay)"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          className={cn(
            "fixed inset-x-0 top-0 flex max-h-dvh drawer-top flex-col overflow-y-auto bg-surface-elevated text-ink outline-none",
            className,
          )}
          {...props}
        >
          <DrawerPrimitive.Content data-slot="drawer-content">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent };
