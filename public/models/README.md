# `public/models/`

Source-of-truth + build output for the 3D assets shipped by Café Zack.

## Layout

```
public/models/
├── README.md           ← you're here
├── manifest.json       ← source-of-truth: every shipped asset listed once
├── optimized/          ← compressed `.glb` files (COMMITTED, shipped to clients)
└── <every other dir>   ← raw sources (gitignored, kept locally only)
```

Only `optimized/`, `manifest.json`, and this README are committed. Everything
else under `public/models/` is the local working dump of raw downloads
(`.fbx` / `.gltf` / `.blend` / textures) — too heavy for git, and not needed
at runtime.

## Build flow

```
bun run assets       # one-shot: vendor decoders + optimize all assets
bun run assets:decoders   # copy three.js draco/basis WASM into public/decoders/
bun run assets:optimize   # run scripts/optimize-assets.ts on the manifest
```

`scripts/optimize-assets.ts` walks `manifest.json`, and for each entry
applies: `dedup → prune → weld → WebP texture compression (Sharp) →
quantize → meshopt → draco`, then writes a single `.glb` to `optimized/`.

After a successful run, the manifest's `built` block is updated with each
output's bytes, sha256, and source bytes — that's the diff CI sees when an
asset changes.

## Adding a new asset

1. Drop the raw source(s) anywhere under `public/models/` (gitignored).
2. Append an entry to `manifest.json`:
   ```json
   {
     "input": "your-folder/scene.gltf",
     "output": "your-asset.glb",
     "role": "What this asset is for (Phase X)"
   }
   ```
3. `bun run assets:optimize`. Confirm the compression ratio is sane.
4. Reference it in code via `useModel("your-asset.glb")`.
5. Commit `optimized/your-asset.glb` + the updated `manifest.json`.

## FBX inputs (deferred)

`gltf-transform` doesn't read FBX. To process the `.fbx` haul we'll add a
Blender headless pre-step (separate PR). Until then, only `.gltf` and `.glb`
inputs work.

## Decoders

The browser-side WASM (draco_decoder, basis_transcoder, meshopt_decoder) is
vendored into `public/decoders/` by `bun run assets:decoders`. The runtime
loader (`src/features/scene/lib/useModel.ts`) points at `/decoders/` so
clients fetch them from the same origin — no CDN dependency, offline-safe.
