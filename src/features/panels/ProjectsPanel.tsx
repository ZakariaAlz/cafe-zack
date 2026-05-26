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

// Three case studies, kept generic + outcome-framed (no client names) per the
// service-copy rules. Each maps to `projects.items.<id>.{title,outcome}` and a
// tags list in i18n. Real write-ups land in MDX later.
const PROJECTS = [
  { id: "health", tags: ["Ingestion", "dbt", "Dashboards"] },
  { id: "telecom", tags: ["Streaming", "Spark", "Warehouse"] },
  { id: "ops", tags: ["Airflow", "Python", "CI"] },
] as const;

/**
 * Projects panel — the Casbah section. Mirrors AboutPanel (Radix Dialog +
 * design tokens + staggered fade-up) but lists outcome-framed case studies.
 */
export function ProjectsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("projects");

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

          <div className="flex flex-col gap-3">
            {PROJECTS.map((p) => (
              <motion.article
                key={p.id}
                variants={fadeUp}
                className="rounded-xl border border-cream/10 bg-charcoal/40 p-4"
              >
                <h3 className="font-medium text-base text-cream">{t(`items.${p.id}.title`)}</h3>
                <p className="mt-1 text-cream/70 text-sm leading-relaxed">
                  {t(`items.${p.id}.outcome`)}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-ochre/30 bg-ochre/10 px-2.5 py-0.5 text-cream/80 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <DialogClose asChild>
              <Button variant="ghost">{t("close")}</Button>
            </DialogClose>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
