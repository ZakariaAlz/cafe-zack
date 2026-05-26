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

// Four cards max (service-copy rule — overwhelm kills conversions); extras go
// in the footer line. Outcome-framed, generic. Maps to `services.items.<id>`.
const SERVICES = ["pipelines", "warehouse", "dashboards", "platform"] as const;

/**
 * Services panel — the Notre-Dame d'Afrique section. Mirrors the other panels;
 * a four-card service menu following the service-copy rules.
 */
export function ServicesPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("services");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border-cream/10 p-0">
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

          <div className="grid gap-3 sm:grid-cols-2">
            {SERVICES.map((id) => (
              <motion.article
                key={id}
                variants={fadeUp}
                className="rounded-xl border border-cream/10 bg-charcoal/40 p-4"
              >
                <h3 className="font-medium text-base text-cream">{t(`items.${id}.title`)}</h3>
                <p className="mt-1 text-cream/70 text-sm leading-relaxed">
                  {t(`items.${id}.outcome`)}
                </p>
              </motion.article>
            ))}
          </div>

          <motion.p variants={fadeUp} className="text-cream/50 text-xs">
            {t("footer")}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            {/* TODO(phase-5): wire to Cal.com booking. */}
            <Button>{t("ctaPrimary")}</Button>
            <DialogClose asChild>
              <Button variant="ghost">{t("close")}</Button>
            </DialogClose>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
