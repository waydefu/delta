"""Inspect CC0 AKM Blender file and export a genuine GLB for review.
Run inside Blender headless. Does not auto-publish or modify the site.
Original source: LonesomeDucky, OpenGameArt (CC0).
"""
import bpy, json, os, pathlib, re

out=pathlib.Path(os.environ.get("AKM_OUTPUT","model-output"))
out.mkdir(parents=True,exist_ok=True)
meshes=[]
materials=set()
for obj in bpy.data.objects:
    if obj.type != "MESH":
        continue
    matnames=[s.material.name for s in obj.material_slots if s.material]
    materials.update(matnames)
    meshes.append({
        "name":obj.name,
        "vertex_count":len(obj.data.vertices),
        "polygon_count":len(obj.data.polygons),
        "dimensions":[round(v,6) for v in obj.dimensions],
        "location":[round(v,6) for v in obj.location],
        "parent":obj.parent.name if obj.parent else None,
        "materials":matnames,
    })
images=[{
    "name":im.name,
    "size":list(im.size),
    "packed":bool(im.packed_file),
    "path":im.filepath,
} for im in bpy.data.images if im.source != "GENERATED"]
patterns={
    "magazine":r"(magaz|mag[_ .]|clip|ammo)",
    "stock":r"(stock|butt)",
    "barrel":r"(barrel|muzzle)",
    "handguard":r"(handguard|forearm|foregrip)",
    "optic":r"(optic|sight|scope|rail)",
}
candidates={key:[m["name"] for m in meshes if re.search(pattern,m["name"],re.I)]
            for key,pattern in patterns.items()}
report={
    "source":"https://opengameart.org/content/weathered-akm-rifle",
    "creator":"LonesomeDucky",
    "license":"CC0 1.0 Universal",
    "model_kind":"source Blender conversion; attachment segmentation unverified",
    "mesh_count":len(meshes),
    "materials":sorted(materials),
    "images":images,
    "part_candidates":candidates,
    "meshes":meshes,
    "warning":"Object names are suggestions, not proof of detached game-compatible parts. Manual inspection required.",
}
(out/"inspection.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
if not meshes:
    raise RuntimeError("No meshes in source")
print("AKM_INSPECTION_SUMMARY",json.dumps({
    "mesh_count":len(meshes),
    "materials":len(materials),
    "images":len(images),
    "part_candidates":candidates,
},ensure_ascii=False))
# Preserve the artist's original materials; do not replace with shiny defaults.
bpy.ops.export_scene.gltf(
    filepath=str(out/"akm.glb"),
    export_format="GLB",
    export_apply=False,
    export_materials="EXPORT",
    export_texcoords=True,
    export_normals=True,
)
print("Export complete:",out/"akm.glb")
