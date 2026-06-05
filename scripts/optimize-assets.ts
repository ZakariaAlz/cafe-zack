/**
 * Compresses raw GLTF/GLB inputs listed in public/models/manifest.json
 * and writes optimized .glb files to public/models/optimized/.
 *
 * Pipeline per asset:
 *   load → dedup → prune → weld → quantize → meshopt → draco → write GLB
 *
 * Run with:  bun run scripts/optimize-assets.ts
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
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
  simplify,
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
  /** Optional sidecar FBX containing animations to graft onto `input`'s
   *  armature. Used when a character mesh ships rigged but unanimated and
   *  the pack puts its Walk/Run/Idle clips in a separate file (e.g. the
   *  people_freepack character bundle).
   */
  animations?: string;
  /** Optional clip allow-list for a mesh that ships MANY embedded actions
   *  (e.g. Business_Man's 26 takes). Names match the final `|`-token exactly;
   *  the Blender step keeps only these, renames them to the clean token, and
   *  exports in ACTIONS mode. Mutually exclusive with `animations`.
   */
  keepActions?: string[];
  /** Optional texture folder (relative to MODELS_DIR) whose albedo/normal maps
   *  are re-attached to textureless materials — FBX imports often fail to
   *  resolve a model's sibling texture folder headless (Tex: 0). */
  textures?: string;
  /** Optional per-asset texture-resolution cap (px). Defaults to 2048. Detailed
   *  Sketchfab cars ship 2K+ maps that balloon the GLB; drop them to 1024/512
   *  for web weight, especially for ambient props seen at a distance. */
  maxTexture?: number;
  /** Optional mesh-decimation ratio (0–1) — fraction of triangles to KEEP.
   *  Photoreal Sketchfab cars are geometry-bound (millions of tris) and stay
   *  multi-MB even after draco; simplifying to ~0.2–0.4 makes them web-light
   *  AND a better stylistic match for the low-poly world. Omit to keep full
   *  resolution (landmarks, characters, already-low-poly props). */
  simplify?: number;
};

type Manifest = {
  _comment?: string;
  assets: Asset[];
  built?: Record<string, { bytes: number; sha256: string; sourceBytes: number; builtAt: string }>;
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = path.join(ROOT, "public", "models");
const OUT_DIR = path.join(MODELS_DIR, "optimized");
const STAGING_DIR = path.join(MODELS_DIR, "_staging");
const MANIFEST_PATH = path.join(MODELS_DIR, "manifest.json");
const BLENDER_INPUTS = new Set([".fbx", ".blend", ".obj"]);

async function loadManifest(): Promise<Manifest> {
  const raw = await readFile(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw) as Manifest;
}

async function fileSize(p: string): Promise<number> {
  return (await stat(p)).size;
}

/**
 * For a .gltf input, sums the gltf JSON + every external buffer + every external
 * image referenced by URI. For binary inputs (.glb / .fbx / .blend / .obj) just
 * returns the single file size.
 */
async function sourceBundleSize(inputPath: string): Promise<number> {
  if (!inputPath.toLowerCase().endsWith(".gltf")) return fileSize(inputPath);
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

async function blenderExport(
  input: string,
  output: string,
  anims?: string,
  keepActions?: string[],
  textures?: string,
): Promise<void> {
  const pyScript = path.join(ROOT, "scripts", "blender_export.py");
  const args = ["-b", "--python", pyScript, "--", input, output];
  // The Blender script accepts order-independent optional flags after I/O: a
  // bare anims sidecar path, `keep=` clip allow-list, and `tex=` texture dir.
  if (anims) args.push(anims);
  else if (keepActions?.length) args.push(`keep=${keepActions.join(",")}`);
  if (textures) args.push(`tex=${path.join(MODELS_DIR, textures)}`);
  const result = spawnSync("blender", args, { stdio: ["ignore", "pipe", "inherit"] });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Blender export failed (${input}). Make sure Blender is installed:  sudo apt install -y blender`,
    );
  }
}

async function ensureGltfInput(
  rawInputPath: string,
  assetOutput: string,
  animsPath?: string,
  keepActions?: string[],
  textures?: string,
): Promise<string> {
  const ext = path.extname(rawInputPath).toLowerCase();
  if (ext === ".gltf" || ext === ".glb") return rawInputPath;
  if (!BLENDER_INPUTS.has(ext)) {
    throw new Error(`Unsupported input extension '${ext}' for ${rawInputPath}`);
  }
  await mkdir(STAGING_DIR, { recursive: true });
  const stem = path.basename(assetOutput, path.extname(assetOutput));
  const stagedGltf = path.join(STAGING_DIR, `${stem}.gltf`);
  await blenderExport(rawInputPath, stagedGltf, animsPath, keepActions, textures);
  return stagedGltf;
}

async function optimizeOne(
  asset: Asset,
): Promise<{ bytes: number; sha256: string; sourceBytes: number }> {
  const rawInputPath = path.join(MODELS_DIR, asset.input);
  const animsPath = asset.animations ? path.join(MODELS_DIR, asset.animations) : undefined;
  const outputPath = path.join(OUT_DIR, asset.output);
  const sourceBytes = await sourceBundleSize(rawInputPath);
  const inputPath = await ensureGltfInput(
    rawInputPath,
    asset.output,
    animsPath,
    asset.keepActions,
    asset.textures,
  );

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.simplifier": MeshoptSimplifier,
  });

  const doc = await io.read(inputPath);

  const texCap = asset.maxTexture ?? 2048;
  await doc.transform(
    dedup(),
    prune(),
    weld(),
    // Mesh decimation for geometry-bound assets (photoreal cars). Runs after
    // weld so the simplifier sees indexed geometry. Skipped (identity) when no
    // ratio is set, so landmarks/characters keep full resolution.
    ...(asset.simplify
      ? [simplify({ simplifier: MeshoptSimplifier, ratio: asset.simplify, error: 0.01 })]
      : []),
    // Color/MR textures → WebP at quality 80; normal maps stay lossless to
    // preserve surface detail. Cap (default 2048) is per-asset overridable so
    // heavy car maps can drop to 1024/512 for web weight.
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [texCap, texCap],
      quality: 80,
      slots: /^(?!normalTexture).*$/,
    }),
    textureCompress({
      encoder: sharp,
      targetFormat: "png",
      resize: [texCap, texCap],
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
  await rm(STAGING_DIR, { recursive: true, force: true });
  const manifest = await loadManifest();
  // Optional CLI filter: `assets:optimize agent-businessman.glb [other.glb …]`
  // builds only the named outputs and preserves the rest of `built` so a
  // single-asset rebuild doesn't wipe the others' hashes. No args → build all.
  const only = process.argv.slice(2);
  const assets = only.length
    ? manifest.assets.filter((a) => only.includes(a.output))
    : manifest.assets;
  if (only.length && assets.length !== only.length) {
    const found = new Set(assets.map((a) => a.output));
    const missing = only.filter((o) => !found.has(o));
    throw new Error(`Unknown output(s): ${missing.join(", ")}`);
  }
  const built: Manifest["built"] = { ...(manifest.built ?? {}) };
  const builtAt = new Date().toISOString();

  console.log(`Optimizing ${assets.length} asset(s) → ${path.relative(ROOT, OUT_DIR)}/\n`);

  let totalIn = 0;
  let totalOut = 0;
  for (const asset of assets) {
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
  await rm(STAGING_DIR, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
