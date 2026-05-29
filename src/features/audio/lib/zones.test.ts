import { describe, expect, it } from "vitest";
import { pickZone } from "./zones";

// Café Zack sits at [15, 0, 12] with an 8-unit radius — see zones.ts.

describe("pickZone", () => {
  it("returns 'street' as the default daytime ambient", () => {
    expect(pickZone({ x: 0, y: 0, z: 0 }, "midday")).toBe("street");
  });

  it("returns 'night' instead of street when time-of-day is night", () => {
    expect(pickZone({ x: 0, y: 0, z: 0 }, "night")).toBe("night");
  });

  it("returns 'cafe' inside the Café Zack radius regardless of time of day", () => {
    expect(pickZone({ x: 15, y: 0, z: 12 }, "midday")).toBe("cafe");
    expect(pickZone({ x: 18, y: 0, z: 15 }, "night")).toBe("cafe");
  });

  it("returns 'street' just outside the radius (8.5 units away)", () => {
    expect(pickZone({ x: 15 + 8.5, y: 0, z: 12 }, "sunset")).toBe("street");
  });

  it("falls back to street when position is null", () => {
    expect(pickZone(null, "midday")).toBe("street");
  });

  it("falls back to night when position is null and it is night", () => {
    expect(pickZone(null, "night")).toBe("night");
  });
});
