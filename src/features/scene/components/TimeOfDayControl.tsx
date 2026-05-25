"use client";

import { TIME_OF_DAY_OPTIONS, type TimeOfDay, useTimeOfDay } from "../store/useTimeOfDay";

const LABELS: Record<TimeOfDay, { glyph: string; aria: string }> = {
  sunrise: { glyph: "↑", aria: "Sunrise" },
  midday: { glyph: "○", aria: "Midday" },
  sunset: { glyph: "↓", aria: "Sunset" },
  night: { glyph: "✦", aria: "Night" },
};

/**
 * Floating time-of-day cycle. Four glyphs (↑ ○ ↓ ✦) in a row;
 * clicking one swaps the scene atmosphere instantly. The store handles
 * all the lighting/sky/fog/bloom changes — this component is pure UI.
 */
export function TimeOfDayControl() {
  const current = useTimeOfDay((s) => s.timeOfDay);
  const setTimeOfDay = useTimeOfDay((s) => s.setTimeOfDay);

  return (
    <div className="flex gap-1 font-mono text-sm">
      {TIME_OF_DAY_OPTIONS.map((t) => {
        const isActive = t === current;
        return (
          <button
            key={t}
            type="button"
            onClick={() => setTimeOfDay(t)}
            aria-label={LABELS[t].aria}
            aria-pressed={isActive}
            className={
              isActive
                ? "flex h-7 w-7 items-center justify-center rounded-full bg-cream/20 text-cream"
                : "flex h-7 w-7 items-center justify-center rounded-full text-cream/40 transition-colors hover:text-cream/80"
            }
          >
            {LABELS[t].glyph}
          </button>
        );
      })}
    </div>
  );
}
