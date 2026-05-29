import type { DriveMode, Vehicle } from "@/lib/world-store";

export type DriveLabel =
  | "driveTaxi"
  | "rideScooter"
  | "stepOut"
  | "stepOffScooter"
  | "callTaxi"
  | "arriving";

export type DrivePromptState = {
  /** Key cap to show (F/C), or null while the taxi is arriving. */
  keyHint: string | null;
  /** i18n key under `prompt`. */
  labelKey: DriveLabel;
};

/**
 * Decide which vehicle affordance to show, given control state. Pure so it
 * can be unit-tested away from React:
 *  - driving R4 → F · step out
 *  - driving scooter → F · step off
 *  - on foot, summon in progress → (no key) · arriving…
 *  - on foot, near scooter → F · ride scooter (scooter wins over R4 if both)
 *  - on foot, near R4 → F · drive
 *  - on foot, away from everything → C · call R4
 * Visibility (hidden while a panel is open) is decided by the caller.
 */
export function drivePromptState(
  mode: DriveMode,
  vehicle: Vehicle,
  nearTaxi: boolean,
  nearScooter: boolean,
  taxiCalling: boolean,
): DrivePromptState {
  if (mode === "driving") {
    return {
      keyHint: "F",
      labelKey: vehicle === "scooter" ? "stepOffScooter" : "stepOut",
    };
  }
  if (taxiCalling) return { keyHint: null, labelKey: "arriving" };
  if (nearScooter) return { keyHint: "F", labelKey: "rideScooter" };
  if (nearTaxi) return { keyHint: "F", labelKey: "driveTaxi" };
  return { keyHint: "C", labelKey: "callTaxi" };
}
