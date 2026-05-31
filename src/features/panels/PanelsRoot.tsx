"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { FadeOverlay } from "@/features/scene/components/FadeOverlay";
import { useWorld } from "@/lib/world-store";
import { AboutPanel } from "./AboutPanel";
import { ContactPanel } from "./ContactPanel";
import { DrivePrompt } from "./DrivePrompt";
import { drivePromptState } from "./drivePrompt";
import { LandmarkPrompt } from "./LandmarkPrompt";
import { ProjectsPanel } from "./ProjectsPanel";
import { ServicesPanel } from "./ServicesPanel";
import { SkillsPanel } from "./SkillsPanel";

/** A simple centred E-prompt pill (interior: leave a note / back to street). */
function InteriorPrompt({ label }: { label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-20 flex justify-center">
      <div className="flex items-center gap-3 rounded-full border border-cream/15 bg-charcoal/70 px-5 py-2.5 backdrop-blur-md">
        <kbd className="rounded-md border border-cream/25 bg-cream/10 px-2 py-0.5 font-mono text-cream text-xs">
          E
        </kbd>
        <span className="text-cream/90 text-sm">{label}</span>
      </div>
    </div>
  );
}

/**
 * 2D overlay root — mounts alongside the Canvas (not inside it). Reads the
 * shared world store: shows proximity prompts, routes E/Esc, renders the panels,
 * and hosts the café FadeOverlay.
 *
 * E semantics depend on `venue` (handler reads live state via getState, so it
 * binds once and never goes stale):
 *  - street, near Café Zack → enter the café (walk-in interior)
 *  - street, near another landmark → open its panel
 *  - interior, at the counter → open the in-world contact form
 *  - interior, at the door → leave back to the street
 * Esc closes the in-world contact form.
 */
export function PanelsRoot() {
  const activePanel = useWorld((s) => s.activePanel);
  const open = useWorld((s) => s.open);
  const close = useWorld((s) => s.close);
  const nearby = useWorld((s) => s.nearby);
  const mode = useWorld((s) => s.mode);
  const nearTaxi = useWorld((s) => s.nearTaxi);
  const taxiCalling = useWorld((s) => s.taxiCalling);
  const venue = useWorld((s) => s.venue);
  const nearOrderPad = useWorld((s) => s.nearOrderPad);
  const nearExit = useWorld((s) => s.nearExit);
  const contactOpen = useWorld((s) => s.contactOpen);
  const t = useTranslations("prompt");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const w = useWorld.getState();
      if (e.key === "Escape") {
        if (w.contactOpen) w.closeContact();
        return;
      }
      if (e.key !== "e" && e.key !== "E") return;

      if (w.venue === "cafe-interior") {
        if (w.contactOpen) return;
        if (w.nearOrderPad) w.openContact();
        else if (w.nearExit) w.exitCafe();
        return;
      }
      // street: Café Zack enters the interior; other landmarks open a panel.
      if (w.activePanel) return;
      if (w.nearby === "cafe-zack") w.enterCafe();
      else if (w.nearby) w.open(w.nearby);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { keyHint, labelKey } = drivePromptState(mode, nearTaxi, taxiCalling);

  if (venue === "cafe-interior") {
    return (
      <>
        {!contactOpen && nearOrderPad && <InteriorPrompt label={t("leaveNote")} />}
        {!contactOpen && nearExit && !nearOrderPad && <InteriorPrompt label={t("backToStreet")} />}
        <FadeOverlay />
      </>
    );
  }

  return (
    <>
      <LandmarkPrompt landmark={activePanel ? null : nearby} />
      <DrivePrompt show={!activePanel} keyHint={keyHint} labelKey={labelKey} />
      <AboutPanel
        open={activePanel === "grande-poste"}
        onOpenChange={(next) => (next ? open("grande-poste") : close())}
      />
      <ProjectsPanel
        open={activePanel === "casbah"}
        onOpenChange={(next) => (next ? open("casbah") : close())}
      />
      <ServicesPanel
        open={activePanel === "notre-dame"}
        onOpenChange={(next) => (next ? open("notre-dame") : close())}
      />
      <SkillsPanel
        open={activePanel === "maqam"}
        onOpenChange={(next) => (next ? open("maqam") : close())}
      />
      <ContactPanel
        open={activePanel === "cafe-zack"}
        onOpenChange={(next) => (next ? open("cafe-zack") : close())}
      />
      <FadeOverlay />
    </>
  );
}
