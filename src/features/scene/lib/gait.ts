/**
 * Locomotion gait selection for the on-foot agent. Pure so it can be unit
 * tested without WebGL/Rapier (the 3D components are e2e-covered, not jsdom).
 *
 * Three states drive the Character's animation crossfades: Idle when stopped,
 * Walking on movement, Running while Shift (sprint) is held. Kept input-tier
 * agnostic — adding a "jog" later is a new branch here, not a rewrite.
 */
export type Gait = "idle" | "walk" | "run";

export function pickGait(moving: boolean, sprint: boolean): Gait {
  if (!moving) return "idle";
  return sprint ? "run" : "walk";
}
