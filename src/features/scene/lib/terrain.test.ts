import { describe, expect, it } from "vitest";
import {
  INLAND_X,
  isSea,
  LANDMARK_XZ,
  type LandmarkId,
  landmarkAnchor,
  SHORE_X,
  terrainHeight,
  WORLD_HALF_Z,
} from "./terrain";

describe("terrainHeight", () => {
  it("is finite everywhere across the world grid", () => {
    for (let x = INLAND_X - 10; x <= SHORE_X + 30; x += 7) {
      for (let z = -WORLD_HALF_Z; z <= WORLD_HALF_Z; z += 9) {
        expect(Number.isFinite(terrainHeight(x, z))).toBe(true);
      }
    }
  });

  it("rises from the coast to the inland heights (amphitheatre slope)", () => {
    // Sample a column clear of the local massifs (z far south of them).
    const z = -110;
    expect(terrainHeight(INLAND_X, z)).toBeGreaterThan(terrainHeight(SHELF_SAMPLE, z));
    expect(terrainHeight(SHELF_SAMPLE, z)).toBeGreaterThanOrEqual(terrainHeight(SHORE_X, z));
  });

  it("dips below the waterline seaward of the shore (a beach, not a wall)", () => {
    expect(terrainHeight(SHORE_X + 20, 0)).toBeLessThan(0);
    // The shore itself is essentially at the waterline.
    expect(Math.abs(terrainHeight(SHORE_X, -110))).toBeLessThan(0.5);
  });

  it("is continuous — small steps give small height changes", () => {
    for (let x = INLAND_X; x <= SHORE_X; x += 13) {
      const a = terrainHeight(x, 5);
      const b = terrainHeight(x + 0.5, 5);
      expect(Math.abs(a - b)).toBeLessThan(1.5);
    }
  });
});

// A point on the flat coastal shelf, clear of massifs, for slope comparisons.
const SHELF_SAMPLE = 45;

describe("landmark anchors", () => {
  const ids: LandmarkId[] = ["grande-poste", "casbah", "notre-dame", "maqam", "cafe-zack"];

  it("places every landmark on the terrain surface", () => {
    for (const id of ids) {
      const [x, y, z] = landmarkAnchor(id);
      expect(y).toBeCloseTo(terrainHeight(x, z), 5);
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("keeps the seaward landmarks low and the heights high (the journey ordering)", () => {
    const y = (id: LandmarkId) => landmarkAnchor(id)[1];
    // Grande Poste (downtown) and Café Zack (Sablette) are the low, coastal ends.
    expect(y("grande-poste")).toBeLessThan(4);
    expect(y("cafe-zack")).toBeLessThan(2);
    // The three monuments on the slopes/heights stand well above downtown.
    expect(y("casbah")).toBeGreaterThan(y("grande-poste") + 6);
    expect(y("notre-dame")).toBeGreaterThan(y("grande-poste") + 6);
    expect(y("maqam")).toBeGreaterThan(y("grande-poste") + 6);
  });

  it("puts Café Zack out over the Sablette at sea level, north landmarks to the north", () => {
    expect(LANDMARK_XZ["cafe-zack"][0]).toBeLessThanOrEqual(SHORE_X);
    expect(isSea(LANDMARK_XZ["cafe-zack"][0])).toBe(false);
    // Notre-Dame is the northern-most (most negative Z).
    expect(LANDMARK_XZ["notre-dame"][1]).toBeLessThan(LANDMARK_XZ.casbah[1]);
    // Maqam is the southern-most (most positive Z).
    expect(LANDMARK_XZ.maqam[1]).toBeGreaterThan(LANDMARK_XZ["grande-poste"][1]);
  });
});
