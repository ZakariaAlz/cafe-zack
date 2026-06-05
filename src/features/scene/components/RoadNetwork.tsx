"use client";

import { useMemo } from "react";

/**
 * Expanded road network layered on top of the core "+" in <Street>: a boulevard
 * extension running north to the seafront, the corniche highway along the
 * beach, a branch to Café Zack, and parking lots in front of the landmarks
 * (where the normalized car fleet will park in a later pass).
 *
 * Generic `RoadSegment` draws asphalt + flush sidewalks + a dashed centre line
 * between any two ground points, in any direction. Like <Street>, it's purely
 * decorative — the flat Ground collider owns driving collision, so the car can
 * roll across the whole plate; flush kerbs avoid clipping.
 */

const ASPHALT = "#2B2B30";
const LINE = "#E8C24A";
const SIDEWALK = "#D8C9A8";
const BAY = "#C9BC9C";

function RoadSegment({
  from,
  to,
  width = 9,
  sidewalk = true,
}: {
  from: [number, number];
  to: [number, number];
  width?: number;
  sidewalk?: boolean;
}) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz); // rotate local +Z onto the segment direction
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[1] + to[1]) / 2;

  const dashes = useMemo(() => {
    const out: number[] = [];
    for (let d = -len / 2 + 2; d < len / 2 - 1; d += 3) out.push(d);
    return out;
  }, [len]);

  return (
    <group position={[cx, 0, cz]} rotation={[0, angle, 0]}>
      <mesh position={[0, 0.011, 0]} receiveShadow>
        <boxGeometry args={[width, 0.02, len]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.85} />
      </mesh>
      {sidewalk &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * (width / 2 + 1.5), 0.012, 0]} receiveShadow>
            <boxGeometry args={[3, 0.02, len]} />
            <meshStandardMaterial color={SIDEWALK} roughness={0.9} />
          </mesh>
        ))}
      {dashes.map((d) => (
        <mesh key={d} position={[0, 0.022, d]}>
          <boxGeometry args={[0.22, 0.006, 1.4]} />
          <meshStandardMaterial color={LINE} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function ParkingLot({
  position,
  width,
  depth,
  rotationY = 0,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  rotationY?: number;
}) {
  const bays = useMemo(() => {
    const out: number[] = [];
    for (let x = -width / 2 + 1.3; x <= width / 2 - 1.3 + 0.001; x += 2.6) out.push(x);
    return out;
  }, [width]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.0105, 0]} receiveShadow>
        <boxGeometry args={[width, 0.02, depth]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.85} />
      </mesh>
      {bays.map((x) => (
        <mesh key={x} position={[x, 0.022, 0]}>
          <boxGeometry args={[0.12, 0.006, depth * 0.82]} />
          <meshStandardMaterial color={BAY} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function RoadNetwork() {
  return (
    <group>
      {/* Boulevard extension north from the core "+" toward the seafront. */}
      <RoadSegment from={[0, -28]} to={[0, -78]} width={9} />
      {/* Corniche highway running E–W along the beach (wider, no inner kerb). */}
      <RoadSegment from={[-62, -76]} to={[62, -76]} width={13} sidewalk={false} />
      {/* Branch east off the boulevard to Café Zack ([15, 12]). */}
      <RoadSegment from={[2, 12]} to={[21, 12]} width={7} />

      {/* Parking lots — kerbside plates the car fleet will fill later. */}
      <ParkingLot position={[10.5, 0, -22]} width={12} depth={7} />
      <ParkingLot position={[18, 0, 7]} width={8} depth={6} />
      <ParkingLot position={[-26, 0, -71]} width={16} depth={7} />
    </group>
  );
}
