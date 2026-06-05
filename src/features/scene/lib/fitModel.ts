import * as THREE from "three";

/**
 * Auto-fit a static GLB scene to a target height + ground level. Mutates the
 * passed Object3D so it (a) scales uniformly so its bounding box height equals
 * `targetHeight`, (b) re-centers horizontally over (0, 0), and (c) sits with
 * its base at `groundY` (defaults to 0).
 *
 * Source models from Sketchfab / Blender often arrive with arbitrary internal
 * scales, off-center origins, and translations baked into the root node —
 * this normalises them in one step so the landmark component only deals with
 * world-space placement.
 *
 * Safe to call inside useEffect with the cloned scene as the dependency.
 */
export function fitModelToHeight(obj: THREE.Object3D, targetHeight: number, groundY = 0): void {
  obj.position.set(0, 0, 0);
  obj.scale.setScalar(1);
  obj.updateMatrixWorld(true);
  const initial = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  initial.getSize(size);
  if (size.y === 0) return;
  const scale = targetHeight / size.y;
  obj.scale.setScalar(scale);
  obj.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  obj.position.set(-center.x, groundY - scaled.min.y, -center.z);
}

/**
 * Auto-fit a model so its longest horizontal axis (a car's length) equals
 * `targetLength`, sitting on the ground (base at `groundY`) and centred in X/Z.
 *
 * Sketchfab cars arrive at wildly different native scales — the 504 break GLB
 * is ~12 m, the coupé ~4.7 m — so dropping them into the world raw makes them
 * different sizes. Normalising on length lands every car at one consistent size
 * regardless of its source units.
 */
export function fitModelToLength(obj: THREE.Object3D, targetLength: number, groundY = 0): void {
  obj.position.set(0, 0, 0);
  obj.scale.setScalar(1);
  obj.updateMatrixWorld(true);
  const size = new THREE.Vector3();
  new THREE.Box3().setFromObject(obj).getSize(size);
  const longest = Math.max(size.x, size.z);
  if (longest === 0) return;
  obj.scale.setScalar(targetLength / longest);
  obj.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  obj.position.set(-center.x, groundY - scaled.min.y, -center.z);
}
