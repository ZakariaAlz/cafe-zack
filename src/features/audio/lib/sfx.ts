"use client";

import { Howler } from "howler";
import { useAudio } from "./audio-store";

/**
 * One-shot "evaporation" cue for the café face-reveal: a soft airy whoosh
 * (band-passed noise sweep) plus a gentle two-note door chime. Synthesised on
 * Howler's shared AudioContext so it needs no audio asset and honours the
 * store's unlock + mute + volume. Swap for a real OGG later by replacing the
 * body — the call site (`playRevealWhoosh`) stays the same.
 */
export function playRevealWhoosh(): void {
  const { unlocked, muted, volume } = useAudio.getState();
  if (!unlocked || muted) return;
  const ctx = Howler.ctx as AudioContext | undefined;
  if (!ctx) return;

  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = Math.min(1, Math.max(0, volume)) * 0.6;
  out.connect(ctx.destination);

  // Airy whoosh — white noise through a band-pass that sweeps up then settles.
  const dur = 0.9;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(300, now);
  bp.frequency.exponentialRampToValueAtTime(2200, now + 0.45);
  bp.frequency.exponentialRampToValueAtTime(500, now + dur);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, now);
  ng.gain.exponentialRampToValueAtTime(0.5, now + 0.12);
  ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  noise.connect(bp).connect(ng).connect(out);
  noise.start(now);
  noise.stop(now + dur);

  // Soft two-note chime for a little doorway warmth under the whoosh.
  const chime = (freq: number, t0: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now + t0);
    g.gain.exponentialRampToValueAtTime(0.32, now + t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + 0.6);
    osc.connect(g).connect(out);
    osc.start(now + t0);
    osc.stop(now + t0 + 0.62);
  };
  chime(659.25, 0.05); // E5
  chime(987.77, 0.18); // B5
}
