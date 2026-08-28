import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/cn.js";

const kbdVariants = cva(
  "inline-flex items-center justify-center rounded-[4px] border font-mono font-medium leading-none tabular-nums",
  {
    variants: {
      size: {
        default: "h-5 min-w-5 px-1 text-[10px]",
        sm: "h-4 min-w-4 px-1 text-[9px]",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** A keyboard-key badge for shortcut hints. Neutral on any surface. */
function Kbd({
  className,
  size,
  ...props
}: React.ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "border-border bg-muted/60 text-muted-foreground",
        kbdVariants({ size, className }),
      )}
      {...props}
    />
  );
}

export { Kbd };
