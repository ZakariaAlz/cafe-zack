import { describe, expect, it } from "vitest";
import { drivePromptState } from "./drivePrompt";

describe("drivePromptState", () => {
  it("driving → F · step out (regardless of proximity/summon)", () => {
    expect(drivePromptState("driving", false, false)).toEqual({
      keyHint: "F",
      labelKey: "stepOut",
    });
    expect(drivePromptState("driving", true, true)).toEqual({ keyHint: "F", labelKey: "stepOut" });
  });

  it("on foot, summon in progress → arriving with no key", () => {
    expect(drivePromptState("onFoot", false, true)).toEqual({
      keyHint: null,
      labelKey: "arriving",
    });
  });

  it("on foot near the taxi → F · drive", () => {
    expect(drivePromptState("onFoot", true, false)).toEqual({
      keyHint: "F",
      labelKey: "driveTaxi",
    });
  });

  it("on foot away from the taxi → C · call", () => {
    expect(drivePromptState("onFoot", false, false)).toEqual({
      keyHint: "C",
      labelKey: "callTaxi",
    });
  });

  it("arriving takes priority over nearTaxi while on foot", () => {
    expect(drivePromptState("onFoot", true, true)).toEqual({
      keyHint: null,
      labelKey: "arriving",
    });
  });
});
