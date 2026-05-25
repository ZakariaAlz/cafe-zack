import { useEffect } from "react";

/**
 * Fires `onPress` once per physical press of `targetKey` (case-insensitive).
 * Edge-triggered (ignores auto-repeat) so a held key doesn't toggle every
 * frame — the counterpart to useKeyboard, which polls held movement keys.
 *
 * Note the key split in the scene: E opens landmark panels (PanelsRoot), F
 * enters/exits the taxi (DriveController) — kept distinct so one press never
 * triggers both. `onPress` should be stable (useCallback).
 */
export function useInteractKey(targetKey: string, onPress: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.toLowerCase() === targetKey.toLowerCase()) onPress();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [targetKey, onPress]);
}
