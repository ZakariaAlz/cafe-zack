import { z } from "zod";

/**
 * Single source of truth for environment variables. Zod-validated.
 * Add a key here BEFORE using it elsewhere so a missing/misconfigured
 * env fails loudly at boot rather than mysteriously at runtime.
 *
 * Phase 0: empty schema. Keys added as we wire features in Phase 5+.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
