/**
 * Car fleet config — real-world lengths (metres) used by fitCarToLength to
 * normalise every GLB to a believable size regardless of its authored scale,
 * and the ambient roster for street traffic.
 *
 * See docs/algiers-worldmap.md §6: source car GLBs arrive wildly mis-scaled
 * (the 504 break GLB is 12.5 m; the Golf Mk1 9.6 m). fitCarToLength + these
 * lengths fix the "giant cars" catastrophe.
 */

export type CarModel =
  | "car-504-coupe.glb"
  | "car-504-break.glb"
  | "car-golf-mk1.glb"
  | "car-hero-2008.glb"
  | "car-205.glb"
  | "car-307.glb"
  | "car-beetle.glb"
  | "car-polo.glb"
  | "car-wolf.glb"
  | "car-lavida.glb"
  | "car-golf-gti.glb"
  | "car-phideon.glb"
  | "car-tcross.glb"
  | "car-ibiza.glb"
  | "car-tiguan-phev.glb"
  | "car-tiguan-allspace.glb";

/** Real length (m) of each car, longest horizontal axis — what fitCarToLength targets. */
export const CAR_LENGTH: Record<CarModel, number> = {
  "car-504-coupe.glb": 4.49,
  "car-504-break.glb": 4.6,
  "car-golf-mk1.glb": 3.82,
  "car-hero-2008.glb": 4.3,
  "car-205.glb": 3.71,
  "car-307.glb": 4.21,
  "car-beetle.glb": 4.08,
  "car-polo.glb": 3.97,
  "car-wolf.glb": 3.6,
  "car-lavida.glb": 4.67,
  "car-golf-gti.glb": 4.29,
  "car-phideon.glb": 5.0,
  "car-tcross.glb": 4.11,
  "car-ibiza.glb": 4.06,
  "car-tiguan-phev.glb": 4.5,
  "car-tiguan-allspace.glb": 4.73,
};

/**
 * The ambient street fleet — every shippable car except the player's hero 2008,
 * mixing the iconic Algiers classics (504s, 205, Golf, Beetle) with modern
 * variety. Order is just the source roster; placement picks from it.
 */
export const AMBIENT_FLEET: CarModel[] = [
  "car-504-coupe.glb",
  "car-504-break.glb",
  "car-golf-mk1.glb",
  "car-205.glb",
  "car-307.glb",
  "car-beetle.glb",
  "car-polo.glb",
  "car-wolf.glb",
  "car-lavida.glb",
  "car-golf-gti.glb",
  "car-phideon.glb",
  "car-tcross.glb",
  "car-ibiza.glb",
  "car-tiguan-phev.glb",
  "car-tiguan-allspace.glb",
];

/** A car's half-length along its forward axis — for spacing cars without overlap. */
export function carHalfLength(model: CarModel): number {
  return CAR_LENGTH[model] / 2;
}
