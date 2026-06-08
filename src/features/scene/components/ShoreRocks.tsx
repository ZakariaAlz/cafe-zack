"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * KayKit Forest rocks scattered in the sea just off the Sablette shore (x > the
 * SHORE_X=70 waterline), varied in size, rotation, and Y so they read as worn
 * boulders the surf wraps around — the "rochers dans la mer" off the promenade.
 * Each clone uses fitModelToHeight to land at a target metres value regardless
 * of the source FBX units; sunk a touch (y<water≈−0.1) so the surf laps them.
 */

type Stone = {
  position: [number, number, number];
  rotationY: number;
  height: number;
};

const STONES: Stone[] = [
  { position: [73, -0.3, 30], rotationY: 0.3, height: 1.6 },
  { position: [75, -0.25, 36], rotationY: 1.7, height: 1.2 },
  { position: [72, -0.35, 42], rotationY: 2.8, height: 2.0 },
  { position: [76, -0.2, 48], rotationY: -0.5, height: 1.4 },
  { position: [74, -0.3, 54], rotationY: -1.8, height: 1.7 },
  { position: [73, -0.3, 22], rotationY: 0.9, height: 1.3 },
  { position: [77, -0.25, 12], rotationY: 2.1, height: 1.1 },
  { position: [72, -0.35, 0], rotationY: -1.2, height: 1.9 },
  { position: [75, -0.3, -10], rotationY: 0.6, height: 1.5 },
];

function Stone({ stone }: { stone: Stone }) {
  const { scene } = useModel("shore-rock.glb");
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    fitModelToHeight(c, stone.height, 0);
    return c;
  }, [scene, stone.height]);

  return (
    <group position={stone.position} rotation={[0, stone.rotationY, 0]}>
      {/* Solid boulder — auto cuboid so you bump it instead of phasing through. */}
      <RigidBody type="fixed" colliders="cuboid">
        <primitive object={cloned} />
      </RigidBody>
    </group>
  );
}

export function ShoreRocks() {
  return (
    <group>
      {STONES.map((s) => (
        <Stone key={`${s.position[0]}:${s.position[2]}`} stone={s} />
      ))}
    </group>
  );
}
