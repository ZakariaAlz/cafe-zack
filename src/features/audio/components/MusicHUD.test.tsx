import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderIntl } from "../../../../tests/unit/render-intl";
import { useAudio } from "../lib/audio-store";

// Howler hits global Audio + AudioContext when constructed. Stub the track
// pool so MusicHUD's setMasterVolume effect is a no-op in jsdom/happy-dom.
vi.mock("../lib/tracks", () => ({
  setMasterVolume: vi.fn(),
  activateZone: vi.fn(),
  stopAll: vi.fn(),
}));

import { MusicHUD } from "./MusicHUD";

afterEach(() => {
  // Reset persisted store between tests.
  useAudio.setState({ muted: false, volume: 0.6, unlocked: false, zone: "street" });
});

describe("MusicHUD", () => {
  it("renders the Volume2 icon and the EN mute label when unmuted", () => {
    renderIntl(<MusicHUD />);
    expect(screen.getByRole("button", { name: /mute music/i })).toBeInTheDocument();
  });

  it("toggles to muted state on click (icon + label flip)", () => {
    renderIntl(<MusicHUD />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(useAudio.getState().muted).toBe(true);
    expect(screen.getByRole("button", { name: /unmute music/i })).toBeInTheDocument();
  });

  it("cycles volume down by 25% on context menu (right-click)", () => {
    renderIntl(<MusicHUD />);
    const btn = screen.getByRole("button");
    expect(useAudio.getState().volume).toBeCloseTo(0.6);
    act(() => {
      fireEvent.contextMenu(btn);
    });
    expect(useAudio.getState().volume).toBeCloseTo(0.35);
  });

  it("wraps back to full volume when stepped past the floor", () => {
    useAudio.setState({ volume: 0.2 });
    renderIntl(<MusicHUD />);
    const btn = screen.getByRole("button");
    act(() => {
      fireEvent.contextMenu(btn);
    });
    expect(useAudio.getState().volume).toBeCloseTo(1);
  });
});
