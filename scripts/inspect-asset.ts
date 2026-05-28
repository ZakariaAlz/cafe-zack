/**
 * Quick structural dump of a compressed GLB — what meshes, bones, animations,
 * materials, and textures are in there. Useful before integrating an asset
 * into a scene component.
 *
 *   bun run scripts/inspect-asset.ts agent-suit.glb
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder } from "meshoptimizer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: bun run scripts/inspect-asset.ts <file-under-public/models/optimized/>");
    process.exit(1);
  }
  const file = path.join(ROOT, "public", "models", "optimized", arg);

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "meshopt.decoder": MeshoptDecoder,
  });
  const doc = await io.read(file);
  const root = doc.getRoot();

  console.log(`\n=== ${arg} ===\n`);
  console.log(
    "Scenes :",
    root.listScenes().map((s) => s.getName() || "<unnamed>"),
  );
  console.log("Nodes  :", root.listNodes().length);
  console.log("Meshes :", root.listMeshes().length);
  console.log("Skins  :", root.listSkins().length);
  console.log("Anims  :", root.listAnimations().length);
  console.log("Mats   :", root.listMaterials().length);
  console.log("Tex    :", root.listTextures().length);

  console.log("\n-- Animations --");
  for (const anim of root.listAnimations()) {
    const dur = Math.max(
      ...anim.listSamplers().map((s) => {
        const input = s.getInput();
        return input ? (input.getArray()?.[input.getArray()!.length - 1] ?? 0) : 0;
      }),
      0,
    );
    console.log(`  ${(anim.getName() || "<unnamed>").padEnd(40)} ${dur.toFixed(2)}s`);
  }

  console.log("\n-- Meshes --");
  for (const mesh of root.listMeshes()) {
    const verts = mesh
      .listPrimitives()
      .reduce((n, p) => n + (p.getAttribute("POSITION")?.getCount() ?? 0), 0);
    const mats = mesh
      .listPrimitives()
      .map((p) => p.getMaterial()?.getName() ?? "<no-mat>")
      .join(", ");
    console.log(
      `  ${(mesh.getName() || "<unnamed>").padEnd(40)} ${String(verts).padStart(7)} verts  [${mats}]`,
    );
  }

  console.log("\n-- Skeleton bones (first skin) --");
  const skin = root.listSkins()[0];
  if (skin) {
    for (const joint of skin.listJoints()) {
      console.log(`  ${joint.getName()}`);
    }
  } else {
    console.log("  (none)");
  }

  console.log("\n-- Materials --");
  for (const mat of root.listMaterials()) {
    const slots: string[] = [];
    if (mat.getBaseColorTexture()) slots.push("baseColor");
    if (mat.getNormalTexture()) slots.push("normal");
    if (mat.getMetallicRoughnessTexture()) slots.push("metallicRoughness");
    if (mat.getEmissiveTexture()) slots.push("emissive");
    if (mat.getOcclusionTexture()) slots.push("occlusion");
    console.log(`  ${(mat.getName() || "<unnamed>").padEnd(40)} [${slots.join(", ")}]`);
  }

  console.log("\n-- Textures --");
  for (const tex of root.listTextures()) {
    const img = tex.getImage();
    const size = tex.getSize();
    console.log(
      `  ${(tex.getName() || "<unnamed>").padEnd(40)} ${tex.getMimeType().padEnd(14)} ${size ? `${size[0]}×${size[1]}` : ""}  ${img ? `${(img.byteLength / 1024).toFixed(1)} KB` : ""}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
