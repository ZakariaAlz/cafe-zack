/**
 * Downsamples the dropped 16K tonemapped sky JPGs to web-friendly 4K
 * equirectangular textures and writes them to `public/textures/`. Run once
 * after dropping new HDRIs in `public/models/`. Sharp handles JPEG decode +
 * resize; targets 4096×2048 (≈half of the source) at quality 85 so each sky
 * lands around 1–2 MB.
 *
 *   bun run scripts/build-skybox.ts
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "models");
const OUT = path.join(ROOT, "public", "textures");

type Job = {
  input: string;
  output: string;
  label: string;
};

const JOBS: Job[] = [
  {
    input: "DaySkyHDRI054B_16K/DaySkyHDRI054B_16K_TONEMAPPED.jpg",
    output: "sky-day.jpg",
    label: "day",
  },
  {
    input: "DaySkyHDRI012B_16K/DaySkyHDRI012B_16K_TONEMAPPED.jpg",
    output: "sky-sunset.jpg",
    label: "sunset",
  },
  {
    input: "NightSkyHDRI003_16K/NightSkyHDRI003_16K_TONEMAPPED.jpg",
    output: "sky-night.jpg",
    label: "night",
  },
];

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  for (const job of JOBS) {
    const src = path.join(SRC, job.input);
    const dst = path.join(OUT, job.output);
    try {
      const info = await sharp(src)
        .resize({ width: 4096, height: 2048, fit: "fill" })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(dst);
      console.log(
        `  ${job.label.padEnd(8)} → ${path.relative(ROOT, dst)}  ${(info.size / 1024).toFixed(0)} KB`,
      );
    } catch (err) {
      console.error(`  ${job.label.padEnd(8)} FAILED:`, err instanceof Error ? err.message : err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
