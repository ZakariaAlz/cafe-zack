"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { fadeUp, staggerChildren } from "@/lib/motion";

const LANGUAGES = ["ar", "fr", "en"] as const;
const FOCUS = ["data", "software", "platform"] as const;

/**
 * About panel — the Grande Poste section. The first screen that proves the
 * design-system foundation: Dialog (Radix a11y) + design tokens + the shared
 * motion language (staggered fade-up reveal on open) + Button CTAs.
 */
export function AboutPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("about");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border-cream/10 p-0">
        <motion.div
          variants={staggerChildren()}
          initial="hidden"
          animate={open ? "visible" : "hidden"}
          className="grid sm:grid-cols-[0.8fr_1fr]"
        >
          {/* Aside — agent monogram (face stays hidden until the café reveal). */}
          <motion.aside
            variants={fadeUp}
            className="flex flex-col gap-5 bg-gradient-to-br from-charcoal to-ochre/20 p-6"
          >
            <span className="font-mono text-ochre text-xs uppercase tracking-[0.2em]">
              {t("eyebrow")}
            </span>
            <div className="grid size-24 place-items-center rounded-xl border border-cream/15 bg-charcoal/60 font-semibold text-4xl text-cream tracking-tight">
              ZA
            </div>
            <p className="text-cream/55 text-sm">{t("place")}</p>

            <div className="mt-auto">
              <p className="mb-2 font-mono text-[10px] text-cream/40 uppercase tracking-widest">
                {t("languagesLabel")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lng) => (
                  <span
                    key={lng}
                    className="rounded-full border border-cream/15 bg-cream/5 px-2.5 py-1 text-cream/80 text-xs"
                  >
                    {t(`languages.${lng}`)}
                  </span>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* Content. */}
          <div className="flex flex-col gap-4 p-6 sm:p-7">
            <motion.div variants={fadeUp}>
              <DialogTitle className="font-semibold text-3xl text-cream tracking-tight">
                {t("name")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-ochre">{t("role")}</DialogDescription>
            </motion.div>

            <motion.p variants={fadeUp} className="text-cream/75 text-sm leading-relaxed">
              {t("bio1")}
            </motion.p>
            <motion.p variants={fadeUp} className="text-cream/75 text-sm leading-relaxed">
              {t("bio2")}
            </motion.p>

            <motion.div variants={fadeUp}>
              <p className="mb-2 font-mono text-[10px] text-cream/40 uppercase tracking-widest">
                {t("focusLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {FOCUS.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-ochre/30 bg-ochre/10 px-2.5 py-1 text-cream/85 text-xs"
                  >
                    {t(`focus.${f}`)}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-2 flex flex-wrap gap-3">
              {/* TODO(phase-5): wire to Cal.com booking. Placeholder for now. */}
              <Button>{t("ctaPrimary")}</Button>
              <DialogClose asChild>
                <Button variant="ghost">{t("ctaSecondary")}</Button>
              </DialogClose>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
