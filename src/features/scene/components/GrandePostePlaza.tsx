"use client";

import { WalkingNPC } from "./WalkingNPC";

/**
 * Three adults walking in front of La Grande Poste — one businessman striding
 * the colonnade, two casual walkers crossing the plaza. Same `WalkingNPC`
 * primitive as the corniche, just with shorter paths so they linger in front
 * of the landmark instead of disappearing into the silhouette.
 *
 * Grande Poste anchor lives at [0, 0, -21]; we lay paths just south of the
 * facade (positive Z is south, so we use z ≈ -16 to -18).
 */

const PLAZA_Z = -16;

export function GrandePostePlaza() {
  return (
    <group>
      <WalkingNPC
        model="npc-walker-m2.glb"
        from={[-8, 0.02, PLAZA_Z]}
        to={[8, 0.02, PLAZA_Z]}
        speed={1.35}
        phase={0}
      />
      <WalkingNPC
        model="npc-walker-f1.glb"
        from={[6, 0.02, PLAZA_Z - 1.5]}
        to={[-7, 0.02, PLAZA_Z - 1.5]}
        speed={1.0}
        phase={0.4}
      />
      <WalkingNPC
        model="npc-walker-m1.glb"
        from={[-5, 0.02, PLAZA_Z + 1.5]}
        to={[5, 0.02, PLAZA_Z + 1.5]}
        speed={1.15}
        phase={0.8}
      />
    </group>
  );
}
