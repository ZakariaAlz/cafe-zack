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

// Elevation colour stops (game-unit heights) for the vertex ramp. Pushed to
// more distinct, saturated tones so the slope reads as varied Algiers ground
// (pale beach sand → warm ochre lower city → dry scrubland green on the
// heights) instead of one flat tan blob.
const SAND = new THREE.Color("#E8D8B0"); // shore / sea floor — pale warm sand
const OCHRE = new THREE.Color("#B97A45"); // lower city ground — warm ochre
const SCRUB = new THREE.Color("#94995E"); // mid slope — dusty olive
const GREEN = new THREE.Color("#6E8A4E"); // dry-green vegetated heights

// Deterministic ±jitter per vertex so each facet varies slightly — kills the
// "single flat colour" read without any texture. Hash of the (x,z) position.
function jitter(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 0.14; // ≈ ±7%
}

function colourForHeight(h: number, x: number, z: number, target: THREE.Color): void {
  if (h < 0.4) {
    target.copy(SAND);
  } else if (h < 4) {
    target.copy(SAND).lerp(OCHRE, (h - 0.4) / 3.6);
  } else if (h < 9) {
    target.copy(OCHRE).lerp(SCRUB, (h - 4) / 5);
  } else {
    target.copy(SCRUB).lerp(GREEN, Math.min(1, (h - 9) / 9));
  }
  const j = 1 + jitter(x, z);
  target.setRGB(Math.min(1, target.r * j), Math.min(1, target.g * j), Math.min(1, target.b * j));
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
      colourForHeight(h, x, z, c);
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
