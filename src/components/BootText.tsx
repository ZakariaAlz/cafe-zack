"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DURATION, EASE } from "@/lib/motion";

/**
 * The "café zack · booting…" stamp — a brief intro flourish that fades out
 * once the world has settled, instead of sitting on screen forever. Client
 * component (timer + AnimatePresence) so the server page stays static.
 */
export function BootText() {
  const t = useTranslations("hero");
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setShow(false), 2800);
    return () => clearTimeout(id);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.1, ease: EASE.outExpo } }}
          transition={{ duration: DURATION.normal }}
          className="pointer-events-none absolute top-4 left-4 z-10 font-mono text-cream/70 text-xs uppercase tracking-[0.2em]"
        >
          {t("booting")}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
