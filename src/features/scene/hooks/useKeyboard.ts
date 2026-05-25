import { useEffect, useRef } from "react";

export type MovementKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

/**
 * Captures WASD + arrow-key state into a ref (no re-renders per keystroke).
 * Consumers read `keys.current.forward` etc. inside their useFrame loop.
 *
 * Returns a ref intentionally so the calling component doesn't re-render
 * on every keypress — physics frames poll the ref each tick.
 */
export function useKeyboard() {
  const keys = useRef<MovementKeys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const map = (k: string): keyof MovementKeys | null => {
      switch (k) {
        case "w":
        case "W":
        case "ArrowUp":
          return "forward";
        case "s":
        case "S":
        case "ArrowDown":
          return "backward";
        case "a":
        case "A":
        case "ArrowLeft":
          return "left";
        case "d":
        case "D":
        case "ArrowRight":
          return "right";
        default:
          return null;
      }
    };

    const down = (e: KeyboardEvent) => {
      const key = map(e.key);
      if (key) keys.current[key] = true;
    };
    const up = (e: KeyboardEvent) => {
      const key = map(e.key);
      if (key) keys.current[key] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
}
