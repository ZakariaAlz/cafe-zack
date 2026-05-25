import { useEffect } from "react";

/**
 * Fires `onPress` once per physical press of the interact key (E). Edge-
 * triggered (ignores auto-repeat) so a held key doesn't toggle every frame —
 * the counterpart to useKeyboard, which polls held movement keys.
 *
 * `onPress` should be stable (wrap in useCallback) so the listener isn't
 * re-bound each render.
 */
export function useInteractKey(onPress: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "e" || e.key === "E") onPress();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPress]);
}
