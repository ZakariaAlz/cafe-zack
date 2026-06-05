"use client";

import { WalkingNPC } from "./WalkingNPC";

/**
 * Pedestrians along the main road + cross-street sidewalks, so the streets feel
 * walked-in rather than empty between landmarks. Reuses the `WalkingNPC`
 * primitive (people_freepack rigs, ping-ponging walk loops). Kept to a handful
 * of skinned figures — they're the heaviest thing per-instance under software-GL
 * — with the existing promenade/plaza crowds carrying the rest.
 *
 * Sidewalks flank the main road at x≈±7 and the cross street at z≈±−12.
 */
export function StreetCrowd() {
  return (
    <group>
      {/* East sidewalk of the main road */}
      <WalkingNPC model="npc-walker-m1.glb" from={[7, 0.02, -18]} to={[7, 0.02, 16]} speed={1.2} />
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[7.6, 0.02, 14]}
        to={[7.6, 0.02, -12]}
        speed={1.0}
        phase={0.5}
      />
      {/* West sidewalk of the main road */}
      <WalkingNPC
        model="npc-walker-m2.glb"
        from={[-7, 0.02, 18]}
        to={[-7, 0.02, -16]}
        speed={1.3}
        phase={0.3}
      />
      {/* Cross-street sidewalk */}
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[-14, 0.02, -7]}
        to={[10, 0.02, -7]}
        speed={1.1}
        phase={0.7}
      />
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[12, 0.02, -16.5]}
        to={[-12, 0.02, -16.5]}
        speed={1.15}
        phase={0.2}
      />
    </group>
  );
}
