"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { DURATION, EASE } from "@/lib/motion";
import type { DriveLabel } from "./drivePrompt";

/**
 * The taxi affordance — distinct from the centred landmark prompt (which uses
 * E). Sits bottom-left so the two never overlap. `keyHint` is the key cap to
 * show (F to drive/step out, C to call) or null while the taxi is arriving.
 */
export function DrivePrompt({
  show,
  keyHint,
  labelKey,
}: {
  show: boolean;
  keyHint: string | null;
  labelKey: DriveLabel;
}) {
  const t = useTranslations("prompt");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: DURATION.normal, ease: EASE.outExpo }}
          className="pointer-events-none fixed bottom-6 left-6 z-20"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-cream/15 bg-charcoal/60 px-4 py-2 backdrop-blur-md">
            {keyHint && (
              <kbd className="rounded-md border border-cream/25 bg-cream/10 px-2 py-0.5 font-mono text-cream text-xs">
                {keyHint}
              </kbd>
            )}
            <span className="text-cream/85 text-xs">{t(labelKey)}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
