"use client";

import { HeightfieldCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";
import {
  buildHeightfield,
  TERRAIN_DEPTH,
  TERRAIN_WIDTH,
  TERRAIN_X_MAX,
  TERRAIN_X_MIN,
  terrainHeight,
} from "../lib/terrain";

/**
 * The Algiers amphitheatre ground — a low-poly slope rising from the bay to the
 * heights, replacing the old flat 320×320 plate.
 *
 * Collision is a Rapier HeightfieldCollider (a solid terrain primitive, not a
 * thin trimesh sheet bodies can fall through) sampled from the SAME
 * terrainHeight() that displaces the visual mesh — so the physics surface is
 * exactly the surface you see and the car climbs the hill you're looking at.
 *
 * Faceted (flatShading) for the stylized Bruno-Simon read, with a height-driven
 * vertex-colour ramp: sandy shore → ochre lower city → dry-green / pale-rock
 * heights.
 */

const WIDTH = TERRAIN_WIDTH; // along X (east–west, the slope)
const DEPTH = TERRAIN_DEPTH; // along Z (north–south)
const W_SEG = Math.round(WIDTH / 3); // ~3-unit facets → chunky low-poly
const D_SEG = Math.round(DEPTH / 3);
const FOOTPRINT_X = (TERRAIN_X_MIN + TERRAIN_X_MAX) / 2;

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
    geo.translate(FOOTPRINT_X, 0, 0); // shift so x spans [X_MIN, X_MAX]

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

  // Collider grid (rows along Z, cols along X) sampled from terrainHeight; the
  // heightfield is centred on the footprint and scaled out to world extents.
  const heights = useMemo(() => buildHeightfield(D_SEG, W_SEG), []);

  return (
    <RigidBody type="fixed" colliders={false} friction={1.3}>
      <HeightfieldCollider
        args={[D_SEG, W_SEG, heights, { x: WIDTH, y: 1, z: DEPTH }]}
        position={[FOOTPRINT_X, 0, 0]}
        friction={1.3}
      />
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.97} metalness={0} />
      </mesh>
    </RigidBody>
  );
}
