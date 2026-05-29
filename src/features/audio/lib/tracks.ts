"use client";

import { Howl } from "howler";
import { useAudio, type Zone } from "./audio-store";

/**
 * Ambient tracks — xDeviruchi "16-bit Fantasy & Adventure" pack (CC0-ish
 * loopable variants). One Howl per zone, all looping, all mono-source so
 * we can crossfade by adjusting volume without re-loading.
 */
const TRACK_FILES: Record<Zone, string> = {
  street: "/audio/street.ogg",
  cafe: "/audio/cafe.ogg",
  night: "/audio/night.ogg",
};

const FADE_MS = 1200;

type Pool = Record<Zone, Howl | null>;
let pool: Pool | null = null;

function ensurePool(): Pool {
  if (pool) return pool;
  const next: Pool = { street: null, cafe: null, night: null };
  for (const zone of Object.keys(TRACK_FILES) as Zone[]) {
    try {
      next[zone] = new Howl({
        src: [TRACK_FILES[zone]],
        loop: true,
        html5: false,
        volume: 0, // starts silent; crossfade brings it up
        preload: true,
        // Quietly drop decode/network errors — missing audio shouldn't
        // crash the scene or spam the console under headless CI.
        onloaderror: () => {},
        onplayerror: () => {},
      });
    } catch {
      next[zone] = null;
    }
  }
  pool = next;
  return next;
}

/**
 * Push the current mute/volume state to every track immediately. Used by
 * MusicHUD's effect so the user gets instant feedback on toggle. The
 * previously-gated `howl.volume() > 0 ? v : 0` form silently dropped unmute
 * because the active track was already at 0 when we tried to bring it back
 * up — now we read the active zone from the store and fade only that one to
 * `volume`, leaving inactive zones at 0.
 */
export function setMasterVolume(volume: number, muted: boolean): void {
  if (!pool) return;
  const activeZone = useAudio.getState().zone;
  const activeTarget = muted ? 0 : volume;
  for (const [name, howl] of Object.entries(pool) as [Zone, Howl | null][]) {
    if (!howl) continue;
    const want = name === activeZone ? activeTarget : 0;
    howl.fade(howl.volume(), want, 200);
  }
}

/**
 * Switches the dominant zone. The active zone fades up to master volume,
 * everything else fades down to silence. Idempotent — safe to call every
 * frame.
 */
export function activateZone(zone: Zone, masterVolume: number, muted: boolean): void {
  const tracks = ensurePool();
  const target = muted ? 0 : masterVolume;
  for (const [name, howl] of Object.entries(tracks) as [Zone, Howl | null][]) {
    if (!howl) continue;
    if (!howl.playing()) howl.play();
    const wantVolume = name === zone ? target : 0;
    const currentVolume = howl.volume();
    if (Math.abs(currentVolume - wantVolume) > 0.01) {
      howl.fade(currentVolume, wantVolume, FADE_MS);
    }
  }
}

/** Stops every track immediately — used on unmount + tests. */
export function stopAll(): void {
  if (!pool) return;
  for (const howl of Object.values(pool)) {
    if (howl) {
      howl.stop();
      howl.unload();
    }
  }
  pool = null;
}
