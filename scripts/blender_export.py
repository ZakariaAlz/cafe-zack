"""
Blender headless GLTF export.

Invoked by scripts/import-with-blender.sh. Opens a .blend or imports a .fbx,
then exports the scene as a GLTF Separate (so gltf-transform can optimize it
afterwards).

Usage (via the wrapper script):
    blender -b --python scripts/blender_export.py -- <input> <output.gltf>
"""

from __future__ import annotations

import os
import sys

import bpy


def reset_scene() -> None:
    """Wipe Blender's startup scene so we don't export the default cube."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)


def import_file(path: str) -> None:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".blend":
        # Append everything from the .blend's first scene.
        with bpy.data.libraries.load(path, link=False) as (data_from, data_to):
            data_to.objects = data_from.objects
            data_to.materials = data_from.materials
            data_to.actions = data_from.actions
        scene = bpy.context.scene
        for obj in data_to.objects:
            if obj is not None:
                scene.collection.objects.link(obj)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=path)
    else:
        raise ValueError(f"Unsupported input: {ext}")


def export_gltf(path: str) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLTF_SEPARATE",
        export_apply=True,
        export_animations=True,
        export_extras=False,
        export_yup=True,
        export_skins=True,
        export_morph=False,
    )


def main() -> None:
    # Args after `--` belong to the script, not Blender itself.
    argv = sys.argv
    if "--" not in argv:
        print("Usage: blender -b --python blender_export.py -- <input> <output.gltf>", file=sys.stderr)
        sys.exit(1)
    args = argv[argv.index("--") + 1 :]
    if len(args) != 2:
        print("Expected exactly two args after --: input output", file=sys.stderr)
        sys.exit(1)
    input_path, output_path = args

    reset_scene()
    import_file(input_path)
    export_gltf(output_path)
    print(f"[blender_export] {input_path} -> {output_path}")


main()
