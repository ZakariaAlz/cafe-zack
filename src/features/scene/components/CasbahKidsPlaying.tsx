"use client";

import { CasbahKid } from "./CasbahKid";

/**
 * Three kids running loops in the Casbah quarter — one tight loop near the
 * market stalls, one wider around the central house, one fast lap on the
 * outer ring. Phase offsets so they're never aligned. Pure decoration; no
 * physics, no collision.
 */
const ANCHOR: [number, number, number] = [-22, 0, -12];

export function CasbahKidsPlaying() {
  return (
    <>
      <CasbahKid center={[ANCHOR[0] - 6, 0, ANCHOR[2] - 4]} radius={3} speed={1.6} phase={0} />
      <CasbahKid center={[ANCHOR[0] - 10, 0, ANCHOR[2] + 2]} radius={4.5} speed={1.2} phase={2.1} />
      <CasbahKid
        center={[ANCHOR[0] - 4, 0, ANCHOR[2] + 6]}
        radius={2.5}
        speed={2.1}
        phase={4.4}
        scale={0.012}
      />
    </>
  );
}
