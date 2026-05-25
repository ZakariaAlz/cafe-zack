/**
 * Pure geometry for the taxi enter/exit/call flow — extracted from
 * <DriveController> so it can be unit-tested without a physics world. All
 * coordinates are world-space XZ (Y is handled by the caller); the taxi's
 * forward axis is -Z.
 */

export type Vec2 = { x: number; z: number };

/** True when `a` is within `radius` of `b` on the ground plane. */
export function withinRadius(a: Vec2, b: Vec2, radius: number): boolean {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz <= radius * radius;
}

/** Spot beside the taxi where the agent is dropped on exit (+X of the cab). */
export function exitSpot(taxi: Vec2, offset: number): Vec2 {
  return { x: taxi.x + offset, z: taxi.z };
}

/** Where a summoned taxi parks relative to the on-foot agent (−X, door side). */
export function summonTarget(agent: Vec2, offset: number): Vec2 {
  return { x: agent.x - offset, z: agent.z };
}

/**
 * Yaw (radians) that points a -Z-forward body from `from` toward `to`, so the
 * summoned taxi glides in nose-first. Returns 0 when the points coincide.
 */
export function faceYaw(from: Vec2, to: Vec2): number {
  return Math.atan2(from.x - to.x, from.z - to.z);
}

/** easeOutCubic for the summon glide; clamps progress to [0,1]. */
export function easeOutCubic(t: number): number {
  const p = Math.min(Math.max(t, 0), 1);
  return 1 - (1 - p) ** 3;
}
