import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Server-side per-request locale + message loading. Wired into Next via
 * `createNextIntlPlugin()` in `next.config.ts`.
 *
 * Falls back to the default locale if the requested one isn't supported,
 * so an unknown `/zz/about` renders the default-locale content rather
 * than 404'ing — friendlier for crawlers and link sharing.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
