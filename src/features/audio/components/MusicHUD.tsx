"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useAudio } from "../lib/audio-store";
import { setMasterVolume } from "../lib/tracks";

/**
 * Minimal music control to match the LocaleSwitcher aesthetic — a single
 * speaker icon that flips between Volume2 and VolumeX as a mute toggle.
 * Volume can be cycled in 25% steps on right-click (kept hidden from
 * a11y to stay focused). Master volume + mute state are persisted via
 * useAudio's zustand-persist middleware.
 */
export function MusicHUD() {
  const t = useTranslations("audio");
  const muted = useAudio((s) => s.muted);
  const volume = useAudio((s) => s.volume);
  const toggleMute = useAudio((s) => s.toggleMute);
  const setVolume = useAudio((s) => s.setVolume);

  useEffect(() => {
    setMasterVolume(volume, muted);
  }, [volume, muted]);

  const cycleVolume = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = volume <= 0.25 ? 1 : Math.max(0, volume - 0.25);
    setVolume(next);
  };

  return (
    <button
      type="button"
      onClick={toggleMute}
      onContextMenu={cycleVolume}
      aria-label={muted ? t("unmute") : t("mute")}
      className="text-cream/40 transition-colors hover:text-cream/70 focus-visible:text-cream/80 focus-visible:outline-none"
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}
