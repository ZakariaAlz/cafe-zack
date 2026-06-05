"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import { INLAND_X, SHORE_X, terrainHeight, WORLD_HALF_Z } from "../lib/terrain";

/**
 * The Algiers amphitheatre ground — a low-poly slope rising from the bay to the
 * heights, replacing the old flat 320×320 plate. The mesh vertices and the
 * Rapier trimesh collider are displaced by the SAME terrainHeight() the
 * landmarks and roads sample, so the physics surface is exactly the surface you
 * see (the car climbs the hill you're looking at; no invisible floor).
 *
 * Faceted (flatShading) for the stylized Bruno-Simon read, with a height-driven
 * vertex-colour ramp: sandy shore → ochre lower city → dry-green / pale-rock
 * heights. Real cobble/asphalt PBR is for the road pass, not the whole terrain.
 */

// Plane footprint: x ∈ [INLAND_X−10, SHORE_X+30], z ∈ [±WORLD_HALF_Z]. Centred at
// origin so the slope runs the full world. Segment ~3 units → chunky low-poly facets.
const X_MIN = INLAND_X - 10;
const X_MAX = SHORE_X + 30;
const WIDTH = X_MAX - X_MIN; // along X (east–west, the slope)
const DEPTH = WORLD_HALF_Z * 2; // along Z (north–south)
const W_SEG = Math.round(WIDTH / 3);
const D_SEG = Math.round(DEPTH / 3);

// Elevation colour stops (game-unit heights) for the vertex ramp.
const SAND = new THREE.Color("#D9C7A0"); // shore / sea floor
const OCHRE = new THREE.Color("#C2885A"); // lower city ground
const PALE = new THREE.Color("#CDBF9A"); // mid slope
const ROCK = new THREE.Color("#9FA68C"); // dry-green heights

function colourForHeight(h: number, target: THREE.Color): void {
  if (h < 0.5) {
    target.copy(SAND);
  } else if (h < 5) {
    target.copy(OCHRE).lerp(PALE, (h - 0.5) / 4.5);
  } else {
    target.copy(PALE).lerp(ROCK, Math.min(1, (h - 5) / 13));
  }
}

export function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, DEPTH, W_SEG, D_SEG);
    // PlaneGeometry lies in XY with +Z normal; lay it flat into XZ (+Y up).
    geo.rotateX(-Math.PI / 2);
    geo.translate((X_MIN + X_MAX) / 2, 0, 0); // shift so x spans [X_MIN, X_MAX]

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colours = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      colourForHeight(h, c);
      colours[i * 3] = c.r;
      colours[i * 3 + 1] = c.g;
      colours[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1.3}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.97} metalness={0} />
      </mesh>
    </RigidBody>
  );
}
