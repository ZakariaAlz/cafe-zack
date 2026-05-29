"use client";

import { Howler } from "howler";
import { useEffect } from "react";
import { useAudio } from "../lib/audio-store";

/**
 * Browsers block AudioContext.resume() until the user has interacted with
 * the page. We listen once for the first pointer/keypress on the window
 * and flip the `unlocked` flag — that's the signal useAmbientZone is
 * waiting for before it starts crossfading tracks.
 *
 * No UI — invisible mount. The first keystroke / mouse click on the world
 * is the gesture, which is the natural way a visitor enters the scene
 * anyway (WASD to drive).
 */
export function AudioGate(): null {
  const unlocked = useAudio((s) => s.unlocked);
  const unlock = useAudio((s) => s.unlock);

  useEffect(() => {
    if (unlocked) return;
    const onGesture = () => {
      const ctx = Howler.ctx;
      if (ctx && ctx.state === "suspended") void ctx.resume();
      unlock();
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [unlocked, unlock]);

  return null;
}
