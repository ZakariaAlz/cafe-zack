import * as THREE from "three";

/**
 * Normalise a car GLB to a real-world length, regardless of the arbitrary scale
 * its author baked in. Source car models arrive wildly inconsistent — the
 * Peugeot 504 break GLB measures 12.5 m long (~2.7× real), the Golf Mk1 9.6 m —
 * which is the "catastrophe" of giant cars towering over the world.
 *
 * `fitCarToLength` mutates the passed Object3D so it (a) scales uniformly so its
 * longest HORIZONTAL axis (max of width/depth — a car is longest along its body)
 * equals `targetLength` metres, (b) re-centres in X/Z over the origin, and
 * (c) seats its lowest point (the tyres) at local y=0 so the car sits flat on
 * the road. Source scale stops mattering — every car ends up the right size.
 *
 * Sibling of fitModelToHeight (which fits a landmark by HEIGHT); cars fit by
 * length because their height varies (a van vs a coupé) but their footprint is
 * the meaningful real-world dimension.
 *
 * Safe to call inside useMemo/useEffect with the cloned scene.
 */
export function fitCarToLength(obj: THREE.Object3D, targetLength: number): void {
  obj.position.set(0, 0, 0);
  obj.scale.setScalar(1);
  obj.updateMatrixWorld(true);

  const initial = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  initial.getSize(size);
  const longestHorizontal = Math.max(size.x, size.z);
  if (longestHorizontal === 0) return;

  const scale = targetLength / longestHorizontal;
  obj.scale.setScalar(scale);
  obj.updateMatrixWorld(true);

  const scaled = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  // Centre X/Z over the origin; drop so the lowest point (wheels) sits at y=0.
  obj.position.set(-center.x, -scaled.min.y, -center.z);
}
