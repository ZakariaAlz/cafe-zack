"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fadeUp, staggerChildren } from "@/lib/motion";

// Tech names are universal — kept in code (not i18n); only the group labels are
// translated (`skills.groups.<id>`).
const GROUPS = [
  { id: "data", items: ["Python", "SQL", "dbt", "Apache Spark", "Airflow", "Kafka", "Pandas"] },
  { id: "platform", items: ["Docker", "Kubernetes", "Linux", "CI/CD", "Terraform", "Bash"] },
  { id: "web", items: ["TypeScript", "React", "Next.js", "Node.js", "Tailwind"] },
  { id: "stores", items: ["PostgreSQL", "ClickHouse", "Redis", "BigQuery", "Superset"] },
] as const;

/**
 * Skills panel — the Maqam Echahid section. The toolkit as grouped tech chips;
 * mirrors the other panels' Dialog + staggered reveal.
 */
export function SkillsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("skills");

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

          <div className="grid gap-4 sm:grid-cols-2">
            {GROUPS.map((g) => (
              <motion.div key={g.id} variants={fadeUp}>
                <p className="mb-2 font-mono text-[10px] text-cream/40 uppercase tracking-widest">
                  {t(`groups.${g.id}`)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cream/15 bg-cream/5 px-2.5 py-1 text-cream/80 text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
