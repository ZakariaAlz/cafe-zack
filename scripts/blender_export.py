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


def select_actions(keep: list[str]) -> None:
    """Keep only the named clips from a mesh that ships many embedded actions
    (e.g. Business_Man's 26 takes), dropping the rest, rename the keepers to
    clean tokens (so the GLB ships `idle`/`walk`/`run` not `Rig|Rig|idle`), and
    stash each onto its own NLA track on the character armature.

    The NLA stash is the load-bearing step: the glTF exporter's ACTIONS mode
    only emits the armature's *active* action plus its NLA strips — loose
    actions sitting in `bpy.data.actions` after an FBX import are ignored. So
    without stashing we'd export a single clip. Matching is on the final
    `|`-token, exact — 'idle' keeps 'Rig|Rig|idle' but NOT 'Rig|Rig|sitting_idle'.
    """
    arm = primary_armature()
    if arm is None:
        raise RuntimeError("No armature to bind selected actions to.")
    if arm.animation_data is None:
        arm.animation_data_create()

    wanted = set(keep)
    kept: dict[str, bpy.types.Action] = {}
    for act in list(bpy.data.actions):
        token = act.name.rsplit("|", 1)[-1]
        if token in wanted and token not in kept:
            act.use_fake_user = True
            act.name = token
            kept[token] = act
        else:
            bpy.data.actions.remove(act)
    missing = wanted - set(kept)
    if missing:
        raise RuntimeError(f"Requested clips not found: {sorted(missing)}")

    # Clear the active action and re-home every keeper as its own NLA strip so
    # ACTIONS-mode export emits one glTF animation per clip.
    arm.animation_data.action = None
    for token, act in kept.items():
        track = arm.animation_data.nla_tracks.new()
        track.name = token
        start = int(act.frame_range[0])
        track.strips.new(token, start, act)


def _find_texture(tex_dir: str, keywords: tuple[str, ...]) -> str | None:
    if not os.path.isdir(tex_dir):
        return None
    for fn in sorted(os.listdir(tex_dir)):
        low = fn.lower()
        if low.endswith((".png", ".jpg", ".jpeg", ".webp")) and any(k in low for k in keywords):
            return os.path.join(tex_dir, fn)
    return None


def apply_textures(tex_dir: str, with_normal: bool = False) -> None:
    """Rewire the albedo map (and optionally a normal map) from `tex_dir` onto
    every material's Principled BSDF. FBX import resolves a model's textures
    against the WRONG folder headless (e.g. it points the maps at `source/*.png`
    instead of the sibling `textures/` dir, and often skips albedo entirely),
    leaving a flat mannequin (Tex: 0 in the GLB). We purge those stale
    image/normal-map nodes and attach the real files by filename.

    Normals are OFF by default: the pipeline ships normal maps as lossless PNG
    (to preserve surface detail), which for a low-poly character balloons the
    GLB by several MB for little gain. Opt in with `tex=dir|normal`.

    `tex=` is an explicit opt-in, so this is assertive: it overrides whatever
    broken texture wiring the import produced rather than tip-toeing around it.
    """
    albedo = _find_texture(tex_dir, ("albedo", "diffuse", "basecolor", "base_color", "_color"))
    normal = _find_texture(tex_dir, ("normal", "_nrm", "_norm")) if with_normal else None
    if not albedo:
        raise RuntimeError(f"No albedo/diffuse texture found in {tex_dir}")

    attached = 0
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            mat.use_nodes = True
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            continue

        # Drop the import's stale texture + normal-map nodes (broken filepaths).
        for n in [n for n in nt.nodes if n.type in {"TEX_IMAGE", "NORMAL_MAP"}]:
            nt.nodes.remove(n)

        base = nt.nodes.new("ShaderNodeTexImage")
        base.image = bpy.data.images.load(albedo, check_existing=True)
        nt.links.new(bsdf.inputs["Base Color"], base.outputs["Color"])

        if normal:
            nmap_img = bpy.data.images.load(normal, check_existing=True)
            nmap_img.colorspace_settings.name = "Non-Color"
            ntex = nt.nodes.new("ShaderNodeTexImage")
            ntex.image = nmap_img
            nmap = nt.nodes.new("ShaderNodeNormalMap")
            nt.links.new(nmap.inputs["Color"], ntex.outputs["Color"])
            nt.links.new(bsdf.inputs["Normal"], nmap.outputs["Normal"])
        attached += 1

    print(f"[blender_export] attached textures to {attached} material(s) from {tex_dir}")


def export_gltf(path: str, all_actions: bool = False) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    kwargs = dict(
        filepath=path,
        export_format="GLTF_SEPARATE",
        export_apply=True,
        export_animations=True,
        export_extras=False,
        export_yup=True,
        export_skins=True,
        export_morph=False,
    )
    if all_actions:
        # Export every retained action as its own glTF animation instead of
        # just the active one (the default that only suits single-clip rigs).
        kwargs["export_animation_mode"] = "ACTIONS"
    bpy.ops.export_scene.gltf(**kwargs)


def main() -> None:
    argv = sys.argv
    if "--" not in argv:
        print("Usage: blender -b --python blender_export.py -- <input> <output.gltf> [anims.fbx]", file=sys.stderr)
        sys.exit(1)
    args = argv[argv.index("--") + 1 :]
    if len(args) < 2:
        print("Expected: input output [anims.fbx] [keep=a,b] [tex=dir]", file=sys.stderr)
        sys.exit(1)

    input_path = args[0]
    output_path = args[1]
    # Remaining args are optional, order-independent flags: a bare path is an
    # animation sidecar FBX; `keep=clipA,clipB` selects among a mesh's embedded
    # actions; `tex=dir` re-attaches albedo/normal maps the FBX import dropped.
    anims_path: str | None = None
    keep: list[str] | None = None
    tex_dir: str | None = None
    tex_normal = False
    for a in args[2:]:
        if a.startswith("keep="):
            keep = a[len("keep=") :].split(",")
        elif a.startswith("tex="):
            tex_dir = a[len("tex=") :]
            # `tex=dir|normal` opts the (heavy) normal map back in.
            if tex_dir.endswith("|normal"):
                tex_dir, tex_normal = tex_dir[: -len("|normal")], True
        else:
            anims_path = a

    reset_scene()
    import_file(input_path)
    if anims_path:
        import_animations(anims_path)
    if keep:
        select_actions(keep)
    if tex_dir:
        apply_textures(tex_dir, with_normal=tex_normal)
    export_gltf(output_path, all_actions=bool(keep))
    extras = "".join(
        s
        for s in (
            f" + anims {anims_path}" if anims_path else "",
            f" + keep {keep}" if keep else "",
            f" + tex {tex_dir}" if tex_dir else "",
        )
    )
    print(f"[blender_export] {input_path} -> {output_path}{extras}")


main()
