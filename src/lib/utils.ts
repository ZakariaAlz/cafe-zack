import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and de-conflict Tailwind utilities.
 * The standard shadcn/ui helper — every UI primitive uses it.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
