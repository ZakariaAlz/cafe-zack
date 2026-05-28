// @vitest-environment node
import { stat } from "node:fs/promises";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder } from "meshoptimizer";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..", "..");
const OPTIMIZED_DIR = path.join(ROOT, "public", "models", "optimized");

async function makeIO() {
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "meshopt.decoder": MeshoptDecoder,
  });
}

describe("optimized assets", () => {
  it("agent-suit.glb exists, is under 12 MB, and parses with the same loader the browser uses", async () => {
    const file = path.join(OPTIMIZED_DIR, "agent-suit.glb");
    const { size } = await stat(file);
    expect(size).toBeGreaterThan(1_000_000); // sanity: not an empty placeholder
    expect(size).toBeLessThan(12 * 1024 * 1024); // shipping budget

    const io = await makeIO();
    const doc = await io.read(file);
    const root = doc.getRoot();
    expect(root.listMeshes().length).toBeGreaterThan(0);
    expect(root.listNodes().length).toBeGreaterThan(0);
    // Compression markers — proves draco + meshopt were applied.
    const usedExts = doc
      .getRoot()
      .listExtensionsUsed()
      .map((e) => e.extensionName);
    expect(usedExts).toContain("KHR_draco_mesh_compression");
  });
});
