"""
Blender headless GLTF export.

Invoked by scripts/optimize-assets.ts via the manifest. Opens a .blend or
imports a .fbx, optionally imports a sidecar animations FBX (when the source
ships character meshes and animations in separate files — e.g. the
people_freepack pack), then exports the scene as a GLTF Separate so
gltf-transform can optimize it afterwards.

Usage:
    blender -b --python scripts/blender_export.py -- <input> <output.gltf> [anims.fbx]

The optional third arg names an FBX containing only animation actions on a
compatible armature. After importing, we re-bind each imported Action to the
mesh's armature and drop the anim-only armature so the exporter writes them
against the right skeleton.
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


def primary_armature() -> bpy.types.Object | None:
    """The first armature in the scene — assumed to be the character's rig."""
    for obj in bpy.context.scene.objects:
        if obj.type == "ARMATURE":
            return obj
    return None


def import_animations(path: str) -> None:
    """Import an animation sidecar FBX, hand its first Action to the first
    armature already in the scene (the character mesh's rig), then remove the
    extra armature + meshes the import brought in. The kept Action is renamed
    to a stable identifier so the glTF exporter writes a predictable
    animation name (default ACTIONS export mode picks up the active action).
    """
    char_armature = primary_armature()
    if char_armature is None:
        raise RuntimeError("No armature in scene to bind animations to.")

    before_objs = set(bpy.context.scene.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    new_objs = set(bpy.context.scene.objects) - before_objs

    # Find the imported armatures and pull out their active animation Action.
    new_armatures = [o for o in new_objs if o.type == "ARMATURE"]
    actions: list[bpy.types.Action] = []
    for arm in new_armatures:
        if arm.animation_data and arm.animation_data.action:
            actions.append(arm.animation_data.action)

    if not actions:
        raise RuntimeError(f"No animation actions found in {path}")

    if char_armature.animation_data is None:
        char_armature.animation_data_create()

    # Rename the first action to match the source file stem so the exported
    # GLB ships a stable, lookup-friendly animation name (e.g. "Running").
    stem = os.path.splitext(os.path.basename(path))[0]
    primary = actions[0]
    primary.name = stem
    char_armature.animation_data.action = primary

    # Drop the temporary armature(s) + their child meshes so the export
    # only contains the character mesh.
    for obj in new_objs:
        try:
            bpy.data.objects.remove(obj, do_unlink=True)
        except Exception:
            pass


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
    argv = sys.argv
    if "--" not in argv:
        print("Usage: blender -b --python blender_export.py -- <input> <output.gltf> [anims.fbx]", file=sys.stderr)
        sys.exit(1)
    args = argv[argv.index("--") + 1 :]
    if len(args) < 2 or len(args) > 3:
        print("Expected 2 or 3 args after --: input output [anims]", file=sys.stderr)
        sys.exit(1)

    input_path = args[0]
    output_path = args[1]
    anims_path = args[2] if len(args) == 3 else None

    reset_scene()
    import_file(input_path)
    if anims_path:
        import_animations(anims_path)
    export_gltf(output_path)
    print(f"[blender_export] {input_path} -> {output_path}" + (f" + anims {anims_path}" if anims_path else ""))


main()
