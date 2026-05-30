import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useKeyboard } from "@/features/scene/hooks/useKeyboard";

function fire(type: "keydown" | "keyup", key: string) {
  window.dispatchEvent(new KeyboardEvent(type, { key }));
}

describe("useKeyboard", () => {
  it("starts with every movement key false (including sprint)", () => {
    const { result } = renderHook(() => useKeyboard());
    expect(result.current.current).toEqual({
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    });
  });

  it("Shift toggles sprint on / off", () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => fire("keydown", "Shift"));
    expect(result.current.current.sprint).toBe(true);
    act(() => fire("keyup", "Shift"));
    expect(result.current.current.sprint).toBe(false);
  });

  it("W and Shift co-exist (sprint while walking forward)", () => {
    const { result } = renderHook(() => useKeyboard());
    act(() => {
      fire("keydown", "w");
      fire("keydown", "Shift");
    });
    expect(result.current.current.forward).toBe(true);
    expect(result.current.current.sprint).toBe(true);
  });
});
