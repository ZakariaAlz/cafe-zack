import { describe, expect, it } from "vitest";
import { easeOutCubic, exitSpot, faceYaw, summonTarget, withinRadius } from "./driving";

describe("driving geometry", () => {
  describe("withinRadius", () => {
    it("is true inside and on the boundary, false outside", () => {
      const origin = { x: 0, z: 0 };
      expect(withinRadius(origin, { x: 2, z: 0 }, 3)).toBe(true);
      expect(withinRadius(origin, { x: 3, z: 0 }, 3)).toBe(true); // on boundary
      expect(withinRadius(origin, { x: 3.01, z: 0 }, 3)).toBe(false);
      expect(withinRadius(origin, { x: 2.2, z: 2.2 }, 3)).toBe(false); // ~3.11
    });
  });

  it("exitSpot drops the agent beside the cab (+X)", () => {
    expect(exitSpot({ x: 5, z: -2 }, 2.2)).toEqual({ x: 7.2, z: -2 });
  });

  it("summonTarget parks the cab beside the agent (−X)", () => {
    expect(summonTarget({ x: 5, z: -2 }, 2.2)).toEqual({ x: 2.8, z: -2 });
  });

  describe("faceYaw", () => {
    it("faces -Z (yaw 0) when the target is straight ahead", () => {
      expect(faceYaw({ x: 0, z: 5 }, { x: 0, z: 0 })).toBeCloseTo(0);
    });
    it("faces +X (yaw -90°) when the target is to the right", () => {
      // forward -Z rotated by -π/2 about Y points to +X
      expect(faceYaw({ x: 0, z: 0 }, { x: 5, z: 0 })).toBeCloseTo(-Math.PI / 2);
    });
    it("returns 0 for coincident points", () => {
      expect(faceYaw({ x: 1, z: 1 }, { x: 1, z: 1 })).toBe(0);
    });
  });

  describe("easeOutCubic", () => {
    it("pins endpoints and clamps out-of-range input", () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
      expect(easeOutCubic(-0.5)).toBe(0);
      expect(easeOutCubic(2)).toBe(1);
    });
    it("eases out (past the midpoint at t=0.5)", () => {
      expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    });
  });
});
