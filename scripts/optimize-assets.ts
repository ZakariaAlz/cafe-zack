/**
 * Compresses raw GLTF/GLB inputs listed in public/models/manifest.json
 * and writes optimized .glb files to public/models/optimized/.
 *
 * Pipeline per asset:
 *   load → dedup → prune → weld → quantize → meshopt → draco → write GLB
 *
 * Run with:  bun run scripts/optimize-assets.ts
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  draco,
  meshopt,
  prune,
  quantize,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

type Asset = {
  input: string;
  output: string;
  role: string;
};

type Manifest = {
  _comment?: string;
  assets: Asset[];
  built?: Record<string, { bytes: number; sha256: string; sourceBytes: number; builtAt: string }>;
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = path.join(ROOT, "public", "models");
const OUT_DIR = path.join(MODELS_DIR, "optimized");
const MANIFEST_PATH = path.join(MODELS_DIR, "manifest.json");

async function loadManifest(): Promise<Manifest> {
  const raw = await readFile(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw) as Manifest;
}

async function fileSize(p: string): Promise<number> {
  return (await stat(p)).size;
}

/**
 * For a .gltf input, sums the gltf JSON + every external buffer + every external
 * image referenced by URI. For a .glb input, returns the file size directly.
 */
async function sourceBundleSize(inputPath: string): Promise<number> {
  if (inputPath.toLowerCase().endsWith(".glb")) return fileSize(inputPath);
  const json = JSON.parse(await readFile(inputPath, "utf-8")) as {
    buffers?: { uri?: string }[];
    images?: { uri?: string }[];
  };
  const dir = path.dirname(inputPath);
  let total = await fileSize(inputPath);
  const refs = [
    ...(json.buffers ?? []).map((b) => b.uri),
    ...(json.images ?? []).map((i) => i.uri),
  ].filter((uri): uri is string => typeof uri === "string" && !uri.startsWith("data:"));
  for (const uri of refs) {
    try {
      total += await fileSize(path.join(dir, decodeURIComponent(uri)));
    } catch {
      // ignored — missing sidecar shows up later in transform
    }
  }
  return total;
}

function sha256(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function optimizeOne(
  asset: Asset,
): Promise<{ bytes: number; sha256: string; sourceBytes: number }> {
  const inputPath = path.join(MODELS_DIR, asset.input);
  const outputPath = path.join(OUT_DIR, asset.output);
  const sourceBytes = await sourceBundleSize(inputPath);

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.simplifier": MeshoptSimplifier,
  });

  const doc = await io.read(inputPath);

  await doc.transform(
    dedup(),
    prune(),
    weld(),
    // Color/MR textures → WebP at quality 80; normal maps stay lossless to
    // preserve surface detail. Cap at 2048 to keep the player rig under a few MB.
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [2048, 2048],
      quality: 80,
      slots: /^(?!normalTexture).*$/,
    }),
    textureCompress({
      encoder: sharp,
      targetFormat: "png",
      resize: [2048, 2048],
      slots: /^normalTexture$/,
    }),
    quantize({ pattern: /^(POSITION|NORMAL|TEXCOORD|COLOR)/ }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
    draco(),
  );

  const glb = await io.writeBinary(doc);
  await writeFile(outputPath, glb);
  const bytes = glb.byteLength;
  return { bytes, sha256: sha256(glb), sourceBytes };
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = await loadManifest();
  const built: Manifest["built"] = {};
  const builtAt = new Date().toISOString();

  console.log(`Optimizing ${manifest.assets.length} asset(s) → ${path.relative(ROOT, OUT_DIR)}/\n`);

  let totalIn = 0;
  let totalOut = 0;
  for (const asset of manifest.assets) {
    const label = `  ${asset.output.padEnd(28)}`;
    try {
      const { bytes, sha256, sourceBytes } = await optimizeOne(asset);
      built[asset.output] = { bytes, sha256, sourceBytes, builtAt };
      totalIn += sourceBytes;
      totalOut += bytes;
      const ratio = ((1 - bytes / sourceBytes) * 100).toFixed(1);
      console.log(
        `${label} ${formatBytes(sourceBytes).padStart(10)} → ${formatBytes(bytes).padStart(10)}  (−${ratio}%)`,
      );
    } catch (err) {
      console.error(`${label} FAILED:`, err instanceof Error ? err.message : err);
      throw err;
    }
  }

  const out: Manifest = { ...manifest, built };
  await writeFile(MANIFEST_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf-8");

  if (totalIn > 0) {
    const totalRatio = ((1 - totalOut / totalIn) * 100).toFixed(1);
    console.log(`\nTotal: ${formatBytes(totalIn)} → ${formatBytes(totalOut)} (−${totalRatio}%)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
