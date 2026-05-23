"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

/**
 * Floating EN / FR toggle. Preserves the current path while switching
 * locale (so /fr/about ↔ /about, not back to the landing page).
 */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("locale");

  return (
    <div className="flex gap-3 font-mono text-xs uppercase tracking-widest">
      {routing.locales.map((other) => (
        <Link
          key={other}
          href={pathname}
          locale={other}
          aria-label={t("switchTo", { name: t(`names.${other}`) })}
          className={
            other === locale ? "text-cream" : "text-cream/40 transition-colors hover:text-cream/70"
          }
        >
          {other}
        </Link>
      ))}
    </div>
  );
}
