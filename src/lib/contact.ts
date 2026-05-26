import { z } from "zod";

/**
 * Contact form schema — shared so the client form and the API route validate
 * identically. Edge-safe (zod only); no secrets here.
 */
export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export type ContactInput = z.infer<typeof contactSchema>;
