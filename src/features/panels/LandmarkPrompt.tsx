"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { DURATION, EASE } from "@/lib/motion";

/**
 * The "press E" affordance that fades in when the taxi is within a landmark's
 * trigger radius. Single landmark (Grande Poste) for now; generalizes to a
 * label lookup when more landmarks come online.
 */
export function LandmarkPrompt({ show }: { show: boolean }) {
  const t = useTranslations("prompt");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: DURATION.normal, ease: EASE.outExpo }}
          className="pointer-events-none fixed inset-x-0 bottom-16 z-20 flex justify-center"
        >
          <div className="flex items-center gap-3 rounded-full border border-cream/15 bg-charcoal/70 px-5 py-2.5 backdrop-blur-md">
            <kbd className="rounded-md border border-cream/25 bg-cream/10 px-2 py-0.5 font-mono text-cream text-xs">
              E
            </kbd>
            <span className="text-cream/90 text-sm">{t("enterGrandePoste")}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
