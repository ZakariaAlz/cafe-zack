"use client";

import { useEffect } from "react";
import { useWorld } from "@/lib/world-store";
import { AboutPanel } from "./AboutPanel";
import { DrivePrompt } from "./DrivePrompt";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "e" || e.key === "E") && nearby && !activePanel) {
        open(nearby);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nearby, activePanel, open]);

  // F prompt shows while driving ("step out") or on foot near the taxi
  // ("drive"); hidden whenever a panel is open so the overlay isn't cluttered.
  const showDrive = !activePanel && (mode === "driving" || nearTaxi);

  return (
    <>
      <LandmarkPrompt show={Boolean(nearby) && !activePanel} />
      <DrivePrompt show={showDrive} labelKey={mode === "driving" ? "stepOut" : "driveTaxi"} />
      <AboutPanel
        open={activePanel === "grande-poste"}
        onOpenChange={(next) => (next ? open("grande-poste") : close())}
      />
    </>
  );
}
