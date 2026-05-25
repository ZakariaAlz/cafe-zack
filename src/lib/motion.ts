import type { Variants } from "framer-motion";

/**
 * The app's single motion language. Every JS-driven animation (Motion/Framer,
 * GSAP) pulls easings + durations from here so the whole site moves with one
 * voice — the difference between "animated" and "polished". Mirrors the CSS
 * custom properties in src/app/globals.css (keep the two in sync).
 */

// Cubic-bézier control points. Typed as mutable 4-tuples so they assign
// directly to Motion's `ease` and Framer transition types.
export const EASE = {
  /** Decisive entrances — fast out, gentle settle. The default. */
  outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Symmetric, weighty — good for reversible UI (panels open/close). */
  inOutQuint: [0.83, 0, 0.17, 1] as [number, number, number, number],
  /** Slight overshoot — playful accents (badges, toasts, the cat). */
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

/** Seconds (Motion/Framer use seconds; CSS mirror is in ms). */
export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.6,
} as const;

/** GSAP names for the same feel (GSAP wants its own easing strings). */
export const GSAP_EASE = {
  outExpo: "expo.out",
  inOutQuint: "power4.inOut",
  spring: "back.out(1.7)",
} as const;

/** Workhorse entrance: fade while rising into place. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.outExpo },
  },
};

/** Parent that reveals children one after another. */
export const staggerChildren = (gap = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: gap, delayChildren: 0.1 } },
});
