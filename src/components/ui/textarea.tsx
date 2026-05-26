import type * as React from "react";
import { cn } from "@/lib/utils";

/** Dark-dialog multiline input, styled to match <Input>. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-md border border-cream/15 bg-charcoal/40 px-3 py-2 text-cream text-sm outline-none transition placeholder:text-cream/35 focus-visible:border-ochre/50 focus-visible:ring-2 focus-visible:ring-ochre/30 disabled:opacity-50 aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
