"use client";

import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { fitModelToHeight } from "../lib/fitModel";
import { useModel } from "../lib/useModel";

/**
 * Six KayKit Forest rocks scattered at the corniche waterline, varied in
 * size, rotation, and Y-offset so they read as worn boulders the surf wraps
 * around. Each clone uses fitModelToHeight to land at a target metres value
 * regardless of the source FBX units.
 */

type Stone = {
  position: [number, number, number];
  rotationY: number;
  height: number;
};

const STONES: Stone[] = [
  { position: [-32, -0.15, -85], rotationY: 0.3, height: 0.9 },
  { position: [-18, -0.1, -86], rotationY: 1.7, height: 1.4 },
  { position: [-3, -0.2, -84.5], rotationY: 2.8, height: 1.1 },
  { position: [12, -0.1, -86.5], rotationY: -0.5, height: 1.6 },
  { position: [27, -0.15, -85], rotationY: -1.8, height: 1.0 },
  { position: [38, -0.2, -86], rotationY: 0.9, height: 1.3 },
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
      <primitive object={cloned} />
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
