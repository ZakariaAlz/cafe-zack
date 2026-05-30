"use client";

import { WalkingNPC } from "./WalkingNPC";

/**
 * Pedestrians at the three landmarks the first crowd pass missed —
 * Notre-Dame d'Afrique (east), Maqam Echahid (south plaza), and the Casbah
 * alleys (west). Each location gets 2-3 NPCs with varied speed + phase so
 * none of the three pairs reads as choreographed.
 */

const NOTRE_DAME = { x: 22, z: -10 } as const;
const MAQAM = { x: 0, z: 40 } as const;
const CASBAH = { x: -22, z: -12 } as const;

export function LandmarkCrowds() {
  return (
    <group>
      {/* Notre-Dame — pilgrims pacing the east approach */}
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[NOTRE_DAME.x - 7, 0.02, NOTRE_DAME.z + 4]}
        to={[NOTRE_DAME.x + 5, 0.02, NOTRE_DAME.z + 4]}
        speed={0.9}
        phase={0.1}
      />
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[NOTRE_DAME.x + 4, 0.02, NOTRE_DAME.z + 6]}
        to={[NOTRE_DAME.x - 6, 0.02, NOTRE_DAME.z + 6]}
        speed={1.0}
        phase={0.55}
      />

      {/* Maqam plaza — visitors crossing the esplanade. Z=40 is the plaza
          centre; we lay paths around its north side so the agent on approach
          from the road sees them between him and the monument. */}
      <WalkingNPC
        model="npc-walker-m2.glb"
        from={[-10, 0.02, MAQAM.z - 14]}
        to={[10, 0.02, MAQAM.z - 14]}
        speed={1.2}
        phase={0}
      />
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[9, 0.02, MAQAM.z - 12]}
        to={[-9, 0.02, MAQAM.z - 12]}
        speed={0.95}
        phase={0.45}
      />
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[-12, 0.02, MAQAM.z - 16]}
        to={[12, 0.02, MAQAM.z - 16]}
        speed={1.15}
        phase={0.75}
      />

      {/* Casbah alleys — slower walkers between the houses + kids loops */}
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[CASBAH.x - 9, 0.02, CASBAH.z + 3]}
        to={[CASBAH.x + 3, 0.02, CASBAH.z + 3]}
        speed={0.8}
        phase={0.3}
      />
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[CASBAH.x - 4, 0.02, CASBAH.z - 7]}
        to={[CASBAH.x - 4, 0.02, CASBAH.z + 7]}
        speed={0.85}
        phase={0.7}
      />
    </group>
  );
}
