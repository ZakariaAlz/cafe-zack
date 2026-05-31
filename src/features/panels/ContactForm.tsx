"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ContactInput, contactSchema } from "@/lib/contact";
import { fadeUp, staggerChildren } from "@/lib/motion";

type Values = ContactInput;

/**
 * The Café Zack contact form — the site's conversion point — as a presentational
 * unit with no surrounding chrome. Validated (react-hook-form + zod, shared
 * `contactSchema`), POSTs to the edge `/api/contact` route, shows a thank-you on
 * success and an inline error otherwise.
 *
 * Extracted from ContactPanel so the SAME form renders both in the 2D Radix
 * dialog (street/fallback) and inside the 3D café on a drei <Html> order pad —
 * one source of truth for validation and the network call.
 */
export function ContactForm({ onSent }: { onSent?: () => void } = {}) {
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
      if (res.ok && json.ok) {
        setSent(true);
        onSent?.();
      } else setFailed(true);
    } catch {
      setFailed(true);
    }
  };

  const field = (name: keyof Values) =>
    errors[name] ? <p className="mt-1 text-destructive/90 text-xs">{t(`errors.${name}`)}</p> : null;

  if (sent) {
    return (
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-ochre/30 bg-ochre/10 p-4 text-cream/85 text-sm"
        data-testid="contact-sent"
      >
        {t("sent")}
      </motion.p>
    );
  }

  return (
    <motion.form
      variants={staggerChildren()}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <motion.div variants={fadeUp}>
        <Label htmlFor="contact-name">{t("name")}</Label>
        <Input id="contact-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        {field("name")}
      </motion.div>
      <motion.div variants={fadeUp}>
        <Label htmlFor="contact-email">{t("email")}</Label>
        <Input
          id="contact-email"
          type="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {field("email")}
      </motion.div>
      <motion.div variants={fadeUp}>
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea
          id="contact-message"
          rows={4}
          aria-invalid={Boolean(errors.message)}
          {...register("message")}
        />
        {field("message")}
      </motion.div>
      {failed && <p className="text-destructive/90 text-xs">{t("failed")}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {t("submit")}
      </Button>
    </motion.form>
  );
}
