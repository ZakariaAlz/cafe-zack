import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match every path EXCEPT:
  // - /api/*  (route handlers do their own auth/i18n)
  // - /_next/*  (Next.js internals)
  // - /_vercel/*  (Vercel internals, harmless on other hosts)
  // - files with extensions (favicon.ico, robots.txt, /models/x.glb, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
