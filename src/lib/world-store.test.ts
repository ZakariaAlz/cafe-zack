import { beforeEach, describe, expect, it } from "vitest";
import { useWorld } from "./world-store";

describe("world-store", () => {
  beforeEach(() => {
    useWorld.setState({
      nearby: null,
      activePanel: null,
      mode: "driving",
      nearTaxi: false,
      taxiCalling: false,
      faceRevealed: false,
    });
  });

  it("tracks the nearby landmark", () => {
    useWorld.getState().setNearby("grande-poste");
    expect(useWorld.getState().nearby).toBe("grande-poste");
    useWorld.getState().setNearby(null);
    expect(useWorld.getState().nearby).toBeNull();
  });

  it("opens and closes a panel independently of proximity", () => {
    useWorld.getState().open("grande-poste");
    expect(useWorld.getState().activePanel).toBe("grande-poste");
    useWorld.getState().close();
    expect(useWorld.getState().activePanel).toBeNull();
  });

  it("starts in driving mode and toggles to on foot", () => {
    expect(useWorld.getState().mode).toBe("driving");
    useWorld.getState().setMode("onFoot");
    expect(useWorld.getState().mode).toBe("onFoot");
  });

  it("tracks taxi proximity and the summon flag", () => {
    useWorld.getState().setNearTaxi(true);
    expect(useWorld.getState().nearTaxi).toBe(true);
    useWorld.getState().setTaxiCalling(true);
    expect(useWorld.getState().taxiCalling).toBe(true);
    useWorld.getState().setTaxiCalling(false);
    expect(useWorld.getState().taxiCalling).toBe(false);
  });

  it("reveals the face once (the café moment)", () => {
    expect(useWorld.getState().faceRevealed).toBe(false);
    useWorld.getState().revealFace();
    expect(useWorld.getState().faceRevealed).toBe(true);
  });
});
