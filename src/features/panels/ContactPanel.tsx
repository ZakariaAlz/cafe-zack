"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fadeUp, staggerChildren } from "@/lib/motion";
import { ContactForm } from "./ContactForm";

/**
 * Contact panel — the Café Zack section as a 2D Radix dialog (the street /
 * fallback path). The validated form itself lives in <ContactForm> so the same
 * conversion form is reused by the in-world 3D café order pad; this component is
 * just the dialog chrome (eyebrow, title, intro) around it.
 */
export function ContactPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("contact");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg overflow-hidden border-cream/10 p-0"
        // The E that opens this panel would otherwise land in the auto-focused
        // name field; don't steal focus on open so it stays empty.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <motion.div
          variants={staggerChildren()}
          initial="hidden"
          animate={open ? "visible" : "hidden"}
          className="flex flex-col gap-5 p-6 sm:p-7"
        >
          <motion.div variants={fadeUp}>
            <span className="font-mono text-ochre text-xs uppercase tracking-[0.2em]">
              {t("eyebrow")}
            </span>
            <DialogTitle className="mt-3 font-semibold text-3xl text-cream tracking-tight">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="mt-1 text-cream/60 text-sm">
              {t("intro")}
            </DialogDescription>
          </motion.div>
          <ContactForm />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
