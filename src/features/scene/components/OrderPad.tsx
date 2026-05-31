"use client";

import { Html } from "@react-three/drei";
import { ContactForm } from "@/features/panels/ContactForm";
import { useWorld } from "@/lib/world-store";

/**
 * The diegetic contact object on the café counter — a small lit order pad. When
 * the visitor is at the counter and presses E (`contactOpen`), a drei
 * <Html transform occlude> panel anchored to the pad hosts the real
 * <ContactForm>: it reads as a form lying on the paper in 3D space, but the
 * inputs underneath are the proven react-hook-form + zod + edge-route form, so
 * the site's conversion path is unchanged.
 *
 * `transform` puts the HTML in world space (tilts/scales with the camera);
 * `occlude` hides it behind geometry. The pad sits just above the counter, its
 * face pointing +Z toward where the agent stands.
 */

const PAD_POS: [number, number, number] = [0.6, 1.06, -2.1];

export function OrderPad() {
  const contactOpen = useWorld((s) => s.contactOpen);

  return (
    <group position={PAD_POS}>
      {/* the clipboard / order pad */}
      <mesh rotation={[-Math.PI / 2.1, 0, 0]} castShadow>
        <boxGeometry args={[0.34, 0.46, 0.03]} />
        <meshStandardMaterial
          color="#F4ECD8"
          emissive="#FFE7B8"
          emissiveIntensity={0.25}
          roughness={0.6}
        />
      </mesh>

      {contactOpen && (
        <Html
          transform
          occlude
          position={[0, 0.5, 0.1]}
          distanceFactor={1.4}
          className="w-[340px]"
          // Don't let R3F swallow pointer/keyboard events meant for the form.
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl border border-cream/15 bg-charcoal/95 p-5 shadow-2xl">
            <p className="mb-3 font-mono text-ochre text-xs uppercase tracking-[0.2em]">
              Café Zack · leave a note
            </p>
            <ContactForm />
          </div>
        </Html>
      )}
    </group>
  );
}
