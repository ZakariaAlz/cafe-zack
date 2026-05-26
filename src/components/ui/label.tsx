import type * as React from "react";
import { cn } from "@/lib/utils";

/** Plain form label (no Radix dep needed for a simple contact form). */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable primitive — callers pass htmlFor
    <label
      className={cn(
        "mb-1.5 block font-mono text-[10px] text-cream/45 uppercase tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
