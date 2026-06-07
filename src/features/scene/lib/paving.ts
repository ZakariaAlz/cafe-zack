import * as THREE from "three";

/**
 * Procedurally draw a seamless paving texture — a grid of stone setts with
 * grout lines and per-tile tonal variation — onto a canvas, returned as a
 * repeat-wrapped THREE texture. Used for the grey Sablette promenade and the
 * narrow grey Casbah lane (real medina is irregular pale-grey stone), so we get
 * a true "pavé" read without shipping a texture file.
 *
 * `cells` = setts per axis across the 512px tile (smaller cells → finer pavé).
 */
export function makePavingTexture(opts: {
  base: string; // mean stone colour
  grout: string; // joint colour
  cells?: number; // setts per axis
  variation?: number; // 0..1 per-tile lightness jitter
}): THREE.CanvasTexture {
  const { base, grout, cells = 6, variation = 0.12 } = opts;
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, S, S);

  const c = new THREE.Color(base);
  const cell = S / cells;
  const gap = Math.max(2, cell * 0.06); // grout width
  // Deterministic hash so the tile is stable across renders/SSR-free.
  const hash = (i: number, j: number) => {
    const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      // Slight per-row brick offset for a laid-stone look.
      const offset = j % 2 === 0 ? 0 : cell * 0.5;
      const x = ((i * cell + offset) % S) + gap / 2;
      const y = j * cell + gap / 2;
      const w = cell - gap;
      const h = cell - gap;
      const t = (hash(i, j) - 0.5) * 2 * variation;
      const tile = c.clone().offsetHSL(0, 0, t);
      ctx.fillStyle = `#${tile.getHexString()}`;
      ctx.fillRect(x, y, w, h);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
