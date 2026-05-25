"use client";

import { useMemo } from "react";

/**
 * Procedural streets (PR: street geometry) layered on top of the ochre Ground
 * — a main road running toward the Grande Poste with a cross street in the
 * plaza in front of it, dashed centre lines, flush sidewalks, and streetlamps
 * that glow at night.
 *
 * Purely decorative: the flat Ground box still owns the driving collision, so
 * nothing here has a collider (the taxi can roll off-road to reach landmarks).
 * Curbs are intentionally flush — a raised curb without a collider would just
 * make the car clip through it. Everything sits a hair above y=0 (0.011–0.022)
 * to avoid z-fighting with the ground. Real asphalt/cobble textures: Phase 4.
 */

const ASPHALT = "#2B2B30";
const LINE = "#E8C24A"; // worn taxi-yellow centre line
const SIDEWALK = "#D8C9A8";
const LAMP = "#FFE9A8";
const POLE = "#3A3A40";

const MAIN_LEN = 56;
const MAIN_W = 9;
const CROSS_Z = -12; // cross street sits in the plaza ahead of the landmark
const CROSS_LEN = 44;
const CROSS_W = 9;

export function Street() {
  // Dashed lane lines, skipping the intersection band so they don't cross.
  const mainDashes = useMemo(() => {
    const out: number[] = [];
    for (let z = -24; z <= 24; z += 3) {
      if (z > CROSS_Z - 6 && z < CROSS_Z + 6) continue;
      out.push(z);
    }
    return out;
  }, []);
  const crossDashes = useMemo(() => {
    const out: number[] = [];
    for (let x = -20; x <= 20; x += 3) {
      if (x > -6 && x < 6) continue;
      out.push(x);
    }
    return out;
  }, []);
  // Streetlamps paired along the main-road sidewalks.
  const lamps = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let z = -20; z <= 20; z += 10) {
      out.push([-6.2, z], [6.2, z]);
    }
    return out;
  }, []);

  return (
    <group>
      {/* sidewalks flanking the main road (flush — no curb to clip) */}
      {[-7, 7].map((x) => (
        <mesh key={`sw${x}`} position={[x, 0.012, 0]} receiveShadow>
          <boxGeometry args={[3, 0.02, MAIN_LEN]} />
          <meshStandardMaterial color={SIDEWALK} roughness={0.9} />
        </mesh>
      ))}

      {/* asphalt: main road + cross street toward the landmark */}
      <mesh position={[0, 0.011, 0]} receiveShadow>
        <boxGeometry args={[MAIN_W, 0.02, MAIN_LEN]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.011, CROSS_Z]} receiveShadow>
        <boxGeometry args={[CROSS_LEN, 0.02, CROSS_W]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.85} />
      </mesh>

      {/* dashed centre lines */}
      {mainDashes.map((z) => (
        <mesh key={`md${z}`} position={[0, 0.022, z]}>
          <boxGeometry args={[0.22, 0.006, 1.4]} />
          <meshStandardMaterial color={LINE} roughness={0.6} />
        </mesh>
      ))}
      {crossDashes.map((x) => (
        <mesh key={`cd${x}`} position={[x, 0.022, CROSS_Z]}>
          <boxGeometry args={[1.4, 0.006, 0.22]} />
          <meshStandardMaterial color={LINE} roughness={0.6} />
        </mesh>
      ))}

      {/* streetlamps (visual only; on the sidewalk, clear of the road) */}
      {lamps.map(([x, z]) => {
        const inward = Math.sign(-x); // arm reaches toward the road
        return (
          <group key={`lamp${x}:${z}`} position={[x, 0, z]}>
            <mesh position={[0, 1.5, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 3, 8]} />
              <meshStandardMaterial color={POLE} roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[inward * 0.4, 3, 0]}>
              <boxGeometry args={[0.8, 0.08, 0.08]} />
              <meshStandardMaterial color={POLE} roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[inward * 0.75, 2.95, 0]}>
              <boxGeometry args={[0.22, 0.14, 0.22]} />
              <meshStandardMaterial
                color={LAMP}
                emissive={LAMP}
                emissiveIntensity={1.4}
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
