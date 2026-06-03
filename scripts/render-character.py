# Quick headless turntable-ish render of a character FBX for visual review.
#   blender -b -P scripts/render-character.py -- <file.fbx> <out.png> [albedo.png]
import bpy
import sys
import math
from mathutils import Vector

argv = sys.argv
rest = argv[argv.index("--") + 1:] if "--" in argv else []
path, out = rest[0], rest[1]
albedo = rest[2] if len(rest) > 2 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=path)

# Force a simple lit material with the albedo so the suit/face read, since FBX
# texture auto-link is unreliable headless.
if albedo:
    img = bpy.data.images.load(albedo)
    for ob in bpy.data.objects:
        if ob.type != "MESH":
            continue
        mat = bpy.data.materials.new("preview")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = img
        mat.node_tree.links.new(bsdf.inputs["Base Color"], tex.outputs["Color"])
        ob.data.materials.clear()
        ob.data.materials.append(mat)

# Bounding box of all meshes → frame the camera.
mins = Vector((1e9, 1e9, 1e9))
maxs = Vector((-1e9, -1e9, -1e9))
for ob in bpy.data.objects:
    if ob.type != "MESH":
        continue
    for c in ob.bound_box:
        w = ob.matrix_world @ Vector(c)
        mins = Vector((min(mins[i], w[i]) for i in range(3)))
        maxs = Vector((max(maxs[i], w[i]) for i in range(3)))
center = (mins + maxs) / 2
height = maxs[2] - mins[2]

cam_data = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.scene.collection.objects.link(cam)
dist = height * 2.2
cam.location = center + Vector((0, -dist, height * 0.1))
# Point at center.
direction = center - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.camera = cam

sun_data = bpy.data.lights.new("sun", "SUN")
sun_data.energy = 4
sun = bpy.data.objects.new("sun", sun_data)
sun.rotation_euler = (math.radians(55), 0, math.radians(40))
bpy.context.scene.collection.objects.link(sun)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 700
scene.render.resolution_y = 800
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new("w")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.12, 0.12, 0.14, 1)
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print(f"RENDER_DONE {out}")
