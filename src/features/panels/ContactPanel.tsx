"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ContactInput, contactSchema } from "@/lib/contact";
import { fadeUp, staggerChildren } from "@/lib/motion";

type Values = ContactInput;

/**
 * Contact panel — the Café Zack section and the site's conversion point.
 * Validated form (react-hook-form + zod, shared schema) that POSTs to the edge
 * /api/contact route; shows a thank-you state on success, an error otherwise.
 */
export function ContactPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: Values) => {
    setFailed(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (res.ok && json.ok) setSent(true);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
  };

  const field = (name: keyof Values) =>
    errors[name] ? <p className="mt-1 text-destructive/90 text-xs">{t(`errors.${name}`)}</p> : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSent(false);
          setFailed(false);
        }
      }}
    >
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

          {sent ? (
            <motion.p
              variants={fadeUp}
              className="rounded-xl border border-ochre/30 bg-ochre/10 p-4 text-cream/85 text-sm"
            >
              {t("sent")}
            </motion.p>
          ) : (
            <motion.form
              variants={fadeUp}
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
              noValidate
            >
              <div>
                <Label htmlFor="contact-name">{t("name")}</Label>
                <Input
                  id="contact-name"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                {field("name")}
              </div>
              <div>
                <Label htmlFor="contact-email">{t("email")}</Label>
                <Input
                  id="contact-email"
                  type="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {field("email")}
              </div>
              <div>
                <Label htmlFor="contact-message">{t("message")}</Label>
                <Textarea
                  id="contact-message"
                  rows={4}
                  aria-invalid={Boolean(errors.message)}
                  {...register("message")}
                />
                {field("message")}
              </div>
              {failed && <p className="text-destructive/90 text-xs">{t("failed")}</p>}
              <Button type="submit" disabled={isSubmitting}>
                {t("submit")}
              </Button>
            </motion.form>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
