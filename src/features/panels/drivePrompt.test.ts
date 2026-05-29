import { describe, expect, it } from "vitest";
import { drivePromptState } from "./drivePrompt";

describe("drivePromptState", () => {
  it("driving the R4 → F · step out (regardless of proximity/summon)", () => {
    expect(drivePromptState("driving", "r4", false, false, false)).toEqual({
      keyHint: "F",
      labelKey: "stepOut",
    });
    expect(drivePromptState("driving", "r4", true, false, true)).toEqual({
      keyHint: "F",
      labelKey: "stepOut",
    });
  });

  it("driving the scooter → F · step off scooter", () => {
    expect(drivePromptState("driving", "scooter", false, false, false)).toEqual({
      keyHint: "F",
      labelKey: "stepOffScooter",
    });
  });

  it("on foot, summon in progress → arriving with no key", () => {
    expect(drivePromptState("onFoot", "r4", false, false, true)).toEqual({
      keyHint: null,
      labelKey: "arriving",
    });
  });

  it("on foot near the scooter → F · ride (wins over R4 if both)", () => {
    expect(drivePromptState("onFoot", "r4", true, true, false)).toEqual({
      keyHint: "F",
      labelKey: "rideScooter",
    });
  });

  it("on foot near the R4 only → F · drive", () => {
    expect(drivePromptState("onFoot", "r4", true, false, false)).toEqual({
      keyHint: "F",
      labelKey: "driveTaxi",
    });
  });

  it("on foot away from everything → C · call R4", () => {
    expect(drivePromptState("onFoot", "r4", false, false, false)).toEqual({
      keyHint: "C",
      labelKey: "callTaxi",
    });
  });

  it("arriving takes priority over near-taxi while on foot", () => {
    expect(drivePromptState("onFoot", "r4", true, false, true)).toEqual({
      keyHint: null,
      labelKey: "arriving",
    });
  });
});
