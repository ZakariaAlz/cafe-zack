import { describe, expect, it } from "vitest";
import { pickGait } from "./gait";

describe("pickGait", () => {
  it("is idle when not moving, regardless of sprint", () => {
    expect(pickGait(false, false)).toBe("idle");
    expect(pickGait(false, true)).toBe("idle");
  });

  it("walks when moving without sprint", () => {
    expect(pickGait(true, false)).toBe("walk");
  });

  it("runs when moving with sprint", () => {
    expect(pickGait(true, true)).toBe("run");
  });
});
