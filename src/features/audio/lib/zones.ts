import type { TimeOfDay } from "@/features/scene/store/useTimeOfDay";
import type { Zone } from "./audio-store";

/**
 * Café Zack lives at [15, 0, 12] in world coords (see CLAUDE.md). The
 * cafe zone covers an 8-unit radius around the storefront — generous so
 * the music change feels like an arrival, not a doorway hit.
 */
const CAFE_POS: [number, number, number] = [15, 0, 12];
const CAFE_RADIUS = 8;

/**
 * Decides which ambient track owns the moment. Café proximity wins over
 * everything; otherwise night vs day picks between the calm night loop and
 * the busier street loop. Pure — easy to unit-test.
 */
export function pickZone(
  position: { x: number; y: number; z: number } | null,
  timeOfDay: TimeOfDay,
): Zone {
  if (position) {
    const dx = position.x - CAFE_POS[0];
    const dz = position.z - CAFE_POS[2];
    if (dx * dx + dz * dz < CAFE_RADIUS * CAFE_RADIUS) return "cafe";
  }
  return timeOfDay === "night" ? "night" : "street";
}
