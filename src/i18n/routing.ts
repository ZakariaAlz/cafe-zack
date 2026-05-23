import { defineRouting } from "next-intl/routing";

/**
 * Locale routing for Café Zack.
 *
 * - English is the default (no URL prefix for `/`, `/about`, etc.)
 * - French adds the `/fr` prefix (`/fr`, `/fr/about`, etc.)
 * - Arabic comes later (v2) with RTL support.
 *
 * `localePrefix: "as-needed"` keeps clean URLs for the primary (English)
 * audience while still serving SEO-friendly localized paths for French.
 */
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
