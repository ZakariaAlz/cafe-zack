/**
 * Vendors the three.js GLTF decoder WASM blobs from node_modules into
 * public/decoders/ so the browser can fetch them at runtime from the same
 * origin (offline-safe, no CDN dependency).
 *
 * Run with:  bun run scripts/copy-decoders.ts
 * Idempotent — re-run after `bun install` to refresh decoders.
 */

import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "node_modules", "three", "examples", "jsm", "libs");
const DEST = path.join(ROOT, "public", "decoders");

async function copyDir(from: string, to: string, skip: RegExp | null = null): Promise<void> {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (skip?.test(entry.name)) continue;
    await copyFile(path.join(from, entry.name), path.join(to, entry.name));
  }
}

async function main(): Promise<void> {
  await mkdir(DEST, { recursive: true });
  // draco_encoder.js is build-side only — clients never need it.
  await copyDir(path.join(SRC, "draco"), path.join(DEST, "draco"), /^draco_encoder/);
  await copyDir(path.join(SRC, "basis"), path.join(DEST, "basis"));
  await copyFile(
    path.join(SRC, "meshopt_decoder.module.js"),
    path.join(DEST, "meshopt_decoder.module.js"),
  );
  console.log(`Decoders copied to ${path.relative(ROOT, DEST)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
