import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { fitCarToLength } from "./fitCar";

/** A stand-in "car GLB": an off-centre, arbitrarily-scaled box in a group. */
function fakeCar(w: number, h: number, d: number, offset: [number, number, number]): THREE.Group {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
  mesh.position.set(...offset);
  group.add(mesh);
  return group;
}

function bounds(obj: THREE.Object3D) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

describe("fitCarToLength", () => {
  it("scales the longest horizontal axis to the target length", () => {
    const car = fakeCar(10, 4, 2, [5, 3, -1]); // longest horizontal = 10 (x)
    fitCarToLength(car, 4.5);
    const { size } = bounds(car);
    expect(Math.max(size.x, size.z)).toBeCloseTo(4.5, 4);
  });

  it("seats the lowest point (wheels) at y=0", () => {
    const car = fakeCar(8, 3, 2, [2, 9, 4]);
    fitCarToLength(car, 4.49);
    const { box } = bounds(car);
    expect(box.min.y).toBeCloseTo(0, 4);
  });

  it("recentres the car over the origin in X and Z", () => {
    const car = fakeCar(6, 2, 3, [-7, 1, 12]);
    fitCarToLength(car, 4);
    const { center } = bounds(car);
    expect(center.x).toBeCloseTo(0, 4);
    expect(center.z).toBeCloseTo(0, 4);
  });

  it("fits by length even when the car is longest along Z", () => {
    const car = fakeCar(2, 4, 12, [0, 0, 0]); // longest horizontal = 12 (z)
    fitCarToLength(car, 4.6);
    const { size } = bounds(car);
    expect(Math.max(size.x, size.z)).toBeCloseTo(4.6, 4);
  });

  it("no-ops safely on a zero-size object", () => {
    const empty = new THREE.Group();
    expect(() => fitCarToLength(empty, 4.5)).not.toThrow();
  });
});
