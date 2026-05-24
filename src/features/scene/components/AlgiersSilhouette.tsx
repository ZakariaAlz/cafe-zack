"use client";

/**
 * Placeholder Algiers skyline — abstract building blocks around the
 * perimeter that gesture at a city without committing to specific
 * landmark geometry yet.
 *
 * Phase 4 replaces these with real low-poly meshes (Quaternius city
 * pack + Meshy AI for the landmarks specifically: La Grande Poste,
 * Casbah, Notre-Dame d'Afrique, Maqam Echahid).
 *
 * Colors are warm ochre/cream — they read against any sky in the
 * time-of-day cycle, picking up directional light naturally.
 */
export function AlgiersSilhouette() {
  return (
    <group>
      {/* west side — taller block (suggests Grande Poste mass) */}
      <mesh position={[-14, 5, -2]} castShadow receiveShadow>
        <boxGeometry args={[5, 10, 4]} />
        <meshStandardMaterial color="#C28F66" roughness={0.85} />
      </mesh>

      {/* west background — slightly behind */}
      <mesh position={[-8, 3.5, -8]} castShadow receiveShadow>
        <boxGeometry args={[4, 7, 4]} />
        <meshStandardMaterial color="#A37A56" roughness={0.85} />
      </mesh>

      {/* center-back — wider, lower (Casbah mass) */}
      <mesh position={[0, 4, -12]} castShadow receiveShadow>
        <boxGeometry args={[8, 8, 5]} />
        <meshStandardMaterial color="#B58668" roughness={0.9} />
      </mesh>

      {/* east — taller cream block (Notre-Dame mass) */}
      <mesh position={[10, 6, -3]} castShadow receiveShadow>
        <boxGeometry args={[4, 12, 4]} />
        <meshStandardMaterial color="#E8DCC4" roughness={0.7} />
      </mesh>

      {/* east background */}
      <mesh position={[15, 4, -7]} castShadow receiveShadow>
        <boxGeometry args={[4, 8, 4]} />
        <meshStandardMaterial color="#C9A07C" roughness={0.85} />
      </mesh>

      {/* a minaret hint — slender white cylinder, north */}
      <mesh position={[5, 7, -10]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 14, 12]} />
        <meshStandardMaterial color="#FAF7F2" roughness={0.6} />
      </mesh>
      {/* minaret cap */}
      <mesh position={[5, 14.4, -10]} castShadow>
        <coneGeometry args={[0.6, 1.2, 12]} />
        <meshStandardMaterial color="#FAF7F2" roughness={0.6} />
      </mesh>

      {/* a low Maqam-Echahid-style trio of arches — north horizon */}
      {([-2, 0, 2] as const).map((x) => (
        <mesh key={x} position={[x, 5, -16]} castShadow>
          <boxGeometry args={[0.8, 10, 0.8]} />
          <meshStandardMaterial color="#8C5638" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
