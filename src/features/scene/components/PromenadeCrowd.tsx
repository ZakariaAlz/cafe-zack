"use client";

import { WalkingNPC } from "./WalkingNPC";

/**
 * Five adults walking the corniche promenade — three on the road-facing
 * tile, two on the sand beside the water. Speeds and phases differ per NPC
 * so the row never aligns, and male / female / businessman variants alternate
 * so the crowd doesn't read as a chorus line.
 *
 * Promenade tile lives at z ≈ -64 (see Beach.tsx); sand sits at z ≈ -72.
 * Each path is ~30–40 m so the loops are long enough that pedestrians don't
 * teleport-snap-back-around at every glance.
 */

const PROMENADE_Z = -64;
const SAND_Z = -72;

export function PromenadeCrowd() {
  return (
    <group>
      {/* Promenade tile — three walkers crossing west↔east at varied phases */}
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[-35, 0.04, PROMENADE_Z + 0.5]}
        to={[35, 0.04, PROMENADE_Z + 0.5]}
        speed={1.2}
        phase={0}
      />
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[30, 0.04, PROMENADE_Z - 0.4]}
        to={[-32, 0.04, PROMENADE_Z - 0.4]}
        speed={1.05}
        phase={0.35}
      />
      <WalkingNPC
        model="npc-walker-m2.glb"
        from={[-25, 0.04, PROMENADE_Z + 1.4]}
        to={[28, 0.04, PROMENADE_Z + 1.4]}
        speed={1.45}
        phase={0.72}
      />

      {/* Sand — two slower walkers down by the water */}
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[-18, 0.05, SAND_Z + 3]}
        to={[18, 0.05, SAND_Z + 3]}
        speed={0.85}
        phase={0.5}
      />
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[22, 0.05, SAND_Z + 5]}
        to={[-22, 0.05, SAND_Z + 5]}
        speed={0.9}
        phase={0.2}
      />
    </group>
  );
}
