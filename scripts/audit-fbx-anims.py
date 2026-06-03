# Headless Blender FBX animation audit.
#   blender -b -P scripts/audit-fbx-anims.py -- <file.fbx>
# Imports the FBX, then lists every animation action with its frame range,
# the armature bone count, and a guess at whether the rig is Mixamo-named
# (so we know if the spy's grafted Mixamo clips would retarget for free).
import bpy
import sys

argv = sys.argv
path = argv[argv.index("--") + 1] if "--" in argv else None
if not path:
    print("AUDIT_ERROR no path")
    sys.exit(1)

# Clean slate.
bpy.ops.wm.read_factory_settings(use_empty=True)
try:
    bpy.ops.import_scene.fbx(filepath=path)
except Exception as e:
    print(f"AUDIT_ERROR import failed: {e}")
    sys.exit(1)

print(f"AUDIT_FILE {path}")

# Armatures + bone names.
arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
for a in arms:
    bones = a.data.bones
    names = [b.name for b in bones]
    mixamo = any("mixamorig" in n.lower() for n in names)
    print(f"AUDIT_ARMATURE {a.name} bones={len(bones)} mixamo={mixamo}")
    print(f"AUDIT_BONES_SAMPLE {names[:8]}")

# Actions (animation clips).
acts = list(bpy.data.actions)
print(f"AUDIT_ACTION_COUNT {len(acts)}")
for act in acts:
    fr = act.frame_range
    print(f"AUDIT_ACTION name='{act.name}' frames={fr[0]:.0f}-{fr[1]:.0f} fcurves={len(act.fcurves)}")
