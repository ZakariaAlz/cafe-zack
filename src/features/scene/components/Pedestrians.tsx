"use client";

import { WalkingNPC } from "./WalkingNPC";

/**
 * Ambient pedestrians for the flat coastal city — people walking the seafront
 * spine, the Sablette promenade, and the Grande Poste forecourt. Each is a
 * WalkingNPC ping-ponging a short straight path (y≈0, the downtown shelf is
 * flat), with varied rigs/speeds/phases so the crowd doesn't read as cloned.
 *
 * Kept light (a dozen) — ambient life, not a dense march. The Casbah quarter
 * has its own kids; this is the downtown/seafront crowd.
 */

const Y = 0.05; // clear the flat ground

type Walk = {
  model: string;
  from: [number, number, number];
  to: [number, number, number];
  speed: number;
  phase: number;
};

const WALKERS: Walk[] = [
  // Sablette promenade — strolling along the seafront (x≈59, varied z).
  { model: "npc-walker-f1.glb", from: [59, Y, 30], to: [59, Y, 52], speed: 1.0, phase: 0 },
  { model: "npc-walker-m2.glb", from: [61, Y, 50], to: [61, Y, 28], speed: 1.2, phase: 0.4 },
  { model: "npc-walker-m1.glb", from: [57, Y, 34], to: [57, Y, 48], speed: 0.9, phase: 1.3 },
  // Seafront spine between downtown and the café.
  { model: "npc-walker-m1.glb", from: [50, Y, 16], to: [58, Y, 34], speed: 1.3, phase: 0.7 },
  { model: "npc-walker-f1.glb", from: [56, Y, 30], to: [48, Y, 14], speed: 1.0, phase: 1.6 },
  // Grande Poste forecourt — people crossing the plaza.
  { model: "npc-walker-m2.glb", from: [40, Y, 6], to: [52, Y, 4], speed: 1.1, phase: 0.2 },
  { model: "npc-walker-f1.glb", from: [50, Y, 10], to: [42, Y, 12], speed: 0.95, phase: 1.1 },
  { model: "npc-walker-m1.glb", from: [44, Y, -2], to: [44, Y, 10], speed: 1.2, phase: 0.5 },
  // Cross street inland from the forecourt.
  { model: "npc-walker-m2.glb", from: [30, Y, 12], to: [40, Y, 8], speed: 1.0, phase: 1.8 },
  { model: "npc-walker-f1.glb", from: [22, Y, 6], to: [32, Y, 10], speed: 0.9, phase: 0.9 },
];

export function Pedestrians() {
  return (
    <group>
      {WALKERS.map((w) => (
        <WalkingNPC
          key={`ped-${w.model}-${w.from[0]}-${w.from[2]}-${w.to[2]}`}
          model={w.model}
          from={w.from}
          to={w.to}
          speed={w.speed}
          phase={w.phase}
        />
      ))}
    </group>
  );
}
