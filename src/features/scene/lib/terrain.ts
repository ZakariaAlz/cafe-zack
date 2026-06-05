/**
 * Amphitheatre terrain — the single source of truth for the height of the
 * Algiers ground at any (x, z). The visual terrain mesh, the Rapier collider,
 * the landmark anchors, and the draped roads all sample THIS function, so they
 * can never disagree (no landmark floating above the slope, no road clipping
 * into a hill).
 *
 * Real Algiers is an amphitheatre: "a large amphitheatre of dazzling white
 * buildings" rising from the Bay of Algiers up the slopes of the Sahel Hills
 * (see docs/algiers-worldmap.md). We reproduce that as a coastal-to-heights
 * gradient, compressed to drivable game units.
 *
 * Coordinate frame (see dossier §3):
 *   +X = East = seaward / DOWNHILL.   −X = West = inland / UPHILL.
 *   −Z = North.                        +Z = South.
 *   The shoreline runs along Z at x = SHORE_X; the sea is x > SHORE_X.
 *
 * Heights are game units, not metres — the real 124 m cliff is compressed so
 * the whole climb stays gentle enough to drive. Slope is the experience; exact
 * metres are not.
 */

// --- World extents -----------------------------------------------------------

/** Shoreline: land for x ≤ SHORE_X, open sea beyond. */
export const SHORE_X = 70;
/** Inland edge of the walkable amphitheatre; the Bouzaréah backdrop sits beyond. */
export const INLAND_X = -90;
/** Half-extent along Z (north–south), spanning the coastal itinerary. */
export const WORLD_HALF_Z = 110;
/** Tallest the gentle base slope reaches at the inland edge. */
const BASE_MAX = 16;
/** Edge of the flat coastal shelf (downtown / port / Sablette sit seaward of this). */
const SHELF_X = 40;

// --- Math helpers ------------------------------------------------------------

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Classic smoothstep on a pre-normalised [0,1] input. */
function smoothstep01(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/** Radial gaussian bump, 1 at the centre, falling off over (rx, rz). */
function bump(x: number, z: number, cx: number, cz: number, rx: number, rz: number): number {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  return Math.exp(-(dx * dx + dz * dz));
}

// --- The amphitheatre ---------------------------------------------------------

/**
 * Gentle base slope: ~0 on the coastal shelf (seaward of SHELF_X), rising
 * smoothly to BASE_MAX at the inland edge. Average grade stays drivable.
 */
function baseSlope(x: number): number {
  const t = (SHELF_X - x) / (SHELF_X - INLAND_X);
  return smoothstep01(t) * BASE_MAX;
}

/**
 * Named massifs — local prominences added on top of the base slope. Each is a
 * smooth gaussian so the terrain rolls rather than spikes. Centres match the
 * landmark anchors below so each monument sits ON its own height.
 */
type Massif = { cx: number; cz: number; rx: number; rz: number; height: number };
const MASSIFS: Massif[] = [
  // Casbah pyramid — a broad cone climbing to the citadel summit (north-centre).
  { cx: 28, cz: -30, rx: 16, rz: 16, height: 13 },
  // Notre-Dame cliff/spur — tall and narrow, a coastal cliff in the north.
  { cx: 40, cz: -78, rx: 11, rz: 15, height: 20 },
  // Maqam Echahid mount — the El Madania heights, broad and commanding (south).
  { cx: -8, cz: 46, rx: 20, rz: 20, height: 12 },
];

/**
 * Height of the walkable terrain at (x, z). Pure, finite, and continuous.
 * Seaward of the shore the "land" dips just under the waterline so the beach
 * reads as a shore, not a wall.
 */
export function terrainHeight(x: number, z: number): number {
  // Seaward of the shoreline: gentle dip below the waterline (a beach, not a cliff).
  if (x > SHORE_X) {
    const into = (x - SHORE_X) / 30;
    return -smoothstep01(into) * 1.5;
  }
  let h = baseSlope(x);
  for (const m of MASSIFS) h += m.height * bump(x, z, m.cx, m.cz, m.rx, m.rz);
  return h;
}

// --- Landmark anchors ---------------------------------------------------------

export type LandmarkId = "grande-poste" | "casbah" | "notre-dame" | "maqam" | "cafe-zack";

/** Ground-plan (x, z) of each landmark, per dossier §3. y comes from the terrain. */
export const LANDMARK_XZ: Record<LandmarkId, [number, number]> = {
  // Downtown, low, near the coast — the start of the journey (About).
  "grande-poste": [46, 2],
  // NW of downtown, climbing the pyramid slope (Projects).
  casbah: [28, -30],
  // Far north, on the coastal cliff/spur (Services).
  "notre-dame": [40, -78],
  // South, on the El Madania heights (Skills).
  maqam: [-8, 46],
  // Sea level on the Sablette, southeast — the reveal (Contact).
  "cafe-zack": [62, 40],
};

/** Full [x, y, z] anchor for a landmark, sitting on the terrain surface. */
export function landmarkAnchor(id: LandmarkId): [number, number, number] {
  const [x, z] = LANDMARK_XZ[id];
  return [x, terrainHeight(x, z), z];
}

/** True where there is open sea (used to gate the water plane / shore props). */
export function isSea(x: number): boolean {
  return x > SHORE_X;
}
