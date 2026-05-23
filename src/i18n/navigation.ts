import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Use these instead of importing from
 * `next/link` or `next/navigation` directly — they handle the locale
 * prefix automatically.
 *
 * Example:
 *   import { Link, useRouter } from "@/i18n/navigation";
 *   <Link href="/about">About</Link>            // localized
 *   router.push("/contact", { locale: "fr" });  // switch locale
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
