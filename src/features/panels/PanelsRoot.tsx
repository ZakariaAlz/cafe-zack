"use client";

import { useEffect } from "react";
import { useWorld } from "@/lib/world-store";
import { AboutPanel } from "./AboutPanel";
import { type DriveLabel, DrivePrompt } from "./DrivePrompt";
import { LandmarkPrompt } from "./LandmarkPrompt";

/**
 * 2D overlay root — mounts alongside the Canvas (not inside it). Reads the
 * shared world store: shows the proximity prompts (E = landmark, F = taxi),
 * opens the matching panel on E, and renders the panels themselves. ESC /
 * overlay click close via Radix.
 */
export function PanelsRoot() {
  const nearby = useWorld((s) => s.nearby);
  const activePanel = useWorld((s) => s.activePanel);
  const open = useWorld((s) => s.open);
  const close = useWorld((s) => s.close);
  const mode = useWorld((s) => s.mode);
  const nearTaxi = useWorld((s) => s.nearTaxi);
  const taxiCalling = useWorld((s) => s.taxiCalling);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "e" || e.key === "E") && nearby && !activePanel) {
        open(nearby);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nearby, activePanel, open]);

  // The taxi prompt is contextual and hidden while a panel is open: step out
  // (driving), arriving (mid-summon), drive (on foot, near it), or call it
  // (on foot, away). Centred landmark E-prompt is separate (bottom centre).
  let keyHint: string | null = "F";
  let labelKey: DriveLabel = "stepOut";
  if (mode === "onFoot") {
    if (taxiCalling) {
      keyHint = null;
      labelKey = "arriving";
    } else if (nearTaxi) {
      labelKey = "driveTaxi";
    } else {
      keyHint = "C";
      labelKey = "callTaxi";
    }
  }

  return (
    <>
      <LandmarkPrompt show={Boolean(nearby) && !activePanel} />
      <DrivePrompt show={!activePanel} keyHint={keyHint} labelKey={labelKey} />
      <AboutPanel
        open={activePanel === "grande-poste"}
        onOpenChange={(next) => (next ? open("grande-poste") : close())}
      />
    </>
  );
}
