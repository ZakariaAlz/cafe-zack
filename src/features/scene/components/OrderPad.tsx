"use client";

/**
 * The diegetic contact object on the café counter — a small lit order pad you
 * walk up to and press E. It is pure 3D decoration: the actual contact form
 * renders as a styled DOM overlay (PanelsRoot, when `contactOpen`), not on the
 * mesh. An earlier attempt projected the form onto the pad via drei
 * `<Html transform occlude>`, but the counter geometry occluded it (the form
 * went invisible) and 3D-transformed inputs are poor for real typing / mobile
 * keyboards / a11y — so the conversion form lives in the DOM where it belongs.
 */

const PAD_POS: [number, number, number] = [0.6, 1.06, -2.1];

export function OrderPad() {
  return (
    <group position={PAD_POS}>
      {/* the clipboard / order pad — warm, lightly emissive so it reads as the
          thing to interact with */}
      <mesh rotation={[-Math.PI / 2.1, 0, 0]} castShadow>
        <boxGeometry args={[0.34, 0.46, 0.03]} />
        <meshStandardMaterial
          color="#F4ECD8"
          emissive="#FFE7B8"
          emissiveIntensity={0.25}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}
