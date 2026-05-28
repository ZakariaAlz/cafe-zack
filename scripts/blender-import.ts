/**
 * Blender headless wrapper: imports a .blend / .fbx / .obj and exports a
 * GLTF Separate file that the gltf-transform pipeline can then optimize.
 *
 *   bun run scripts/blender-import.ts <input> <output.gltf>
 *
 * Requires Blender on PATH (sudo apt install blender).
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main(): void {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg || !outputArg) {
    console.error("usage: bun run scripts/blender-import.ts <input> <output.gltf>");
    process.exit(1);
  }
  const input = path.resolve(inputArg);
  const output = path.resolve(outputArg);
  const pyScript = path.join(ROOT, "scripts", "blender_export.py");

  const result = spawnSync("blender", ["-b", "--python", pyScript, "--", input, output], {
    stdio: "inherit",
  });
  if (result.error) {
    console.error("Blender failed to launch:", result.error.message);
    console.error("Install Blender first:  sudo apt install -y blender");
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

main();
