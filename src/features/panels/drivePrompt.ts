import type { DriveMode } from "@/lib/world-store";

export type DriveLabel = "driveTaxi" | "stepOut" | "callTaxi" | "arriving";

export type DrivePromptState = {
  /** Key cap to show (F/C), or null while the taxi is arriving. */
  keyHint: string | null;
  /** i18n key under `prompt`. */
  labelKey: DriveLabel;
};

/**
 * Decide which taxi affordance to show, given control state. Pure so it can be
 * unit-tested away from React:
 *  - driving → F · step out
 *  - on foot, summon in progress → (no key) · arriving…
 *  - on foot, near the taxi → F · drive
 *  - on foot, away → C · call
 * Visibility (hidden while a panel is open) is decided by the caller.
 */
export function drivePromptState(
  mode: DriveMode,
  nearTaxi: boolean,
  taxiCalling: boolean,
): DrivePromptState {
  if (mode === "driving") return { keyHint: "F", labelKey: "stepOut" };
  if (taxiCalling) return { keyHint: null, labelKey: "arriving" };
  if (nearTaxi) return { keyHint: "F", labelKey: "driveTaxi" };
  return { keyHint: "C", labelKey: "callTaxi" };
}
