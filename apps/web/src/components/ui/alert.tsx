import * as React from "react";

import { cn } from "@/lib/utils";

// Restyled after add (CPT-16): surface-alt panel, no radius (CPT-05), no border or shadow
// (CPT-06, COL-15). The icon sits in the first column; title, description and action
// stack in the second. Type comes from the typography roles.
function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 bg-surface-alt p-5 text-ink",
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 font-ui text-sm font-semibold text-ink",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 font-ui text-xs font-medium text-ink-secondary",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("col-start-2 mt-3", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
