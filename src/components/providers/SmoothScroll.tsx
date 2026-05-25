"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Lenis smooth scroll for the scrollable SSR pages (About / Projects / the
 * services menu, etc.) — the buttery inertia behind most award-winning sites.
 *
 * NOT used on the fullscreen 3D route: that page has overflow:hidden and the
 * ChaseCamera owns motion there. Wrap a long-scroll page's content in
 * <SmoothScroll> to opt in; it adds the `.lenis` class to <html>.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
