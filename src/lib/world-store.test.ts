import { beforeEach, describe, expect, it } from "vitest";
import { useWorld } from "./world-store";

describe("world-store", () => {
  beforeEach(() => {
    useWorld.setState({ nearby: null, activePanel: null });
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
});
