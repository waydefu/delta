"""Inspect creator CC0 AKM with bpy 4.5.15 and export glTF, no auto-exec.
Source: LonesomeDucky / OpenGameArt.
This is a research artifact, not a game-verified modular weapon.
"""
import os
import re
import json
from pathlib import Path
import bpy

source = Path(os.environ["AKM_SOURCE"])
output = Path(os.environ.get("AKM_OUTPUT", "model-output"))
output.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.use_scripts_auto_execute = False
bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False, use_scripts=False)
meshes=[]
materials=set()
for obj in bpy.data.objects:
    if obj.type!="MESH":
        continue
    mats=[s.material.name for s in obj.material_slots if s.material]
    materials.update(mats)
    meshes.append({
        "name":obj.name,
        "vertices":len(obj.data.vertices),
        "polygons":len(obj.data.polygons),
        "dimensions":[round(float(n),5) for n in obj.dimensions],
        "location":[round(float(n),5) for n in obj.location],
        "parent":obj.parent.name if obj.parent else None,
        "materials":mats
    })

def inspect_connected_islands(obj, top_n=32):
    """Structural topology audit only. Does not imply a game-verified part."""
    mesh=obj.data
    n=len(mesh.vertices)
    parents=list(range(n))
    rank=[0]*n
    def find(x):
        while parents[x]!=x:
            parents[x]=parents[parents[x]]
            x=parents[x]
        return x
    def union(a,b):
        x=find(a);y=find(b)
        if x==y:return
        if rank[x]<rank[y]:x,y=y,x
        parents[y]=x
        if rank[x]==rank[y]:rank[x]+=1
    for edge in mesh.edges:union(edge.vertices[0],edge.vertices[1])
    components={}
    for v in mesh.vertices:
        key=find(v.index)
        d=components.setdefault(key,{
            "vertices":0,"polygons":0,
            "min":[float("inf")]*3,"max":[float("-inf")]*3,
            "surfaceArea":0.0
        })
        d["vertices"]+=1
        for k in range(3):
            d["min"][k]=min(d["min"][k],float(v.co[k]))
            d["max"][k]=max(d["max"][k],float(v.co[k]))
    for polygon in mesh.polygons:
        key=find(polygon.vertices[0]);d=components[key]
        d["polygons"]+=1;d["surfaceArea"]+=polygon.area
    ranked=sorted(components.values(),key=lambda x:x["surfaceArea"],reverse=True)
    for i,p in enumerate(ranked):
        p["islandId"]=i
        p["min"]=[round(x,5) for x in p["min"]]
        p["max"]=[round(x,5) for x in p["max"]]
        p["dimensions"]=[round(p["max"][k]-p["min"][k],5) for k in range(3)]
        p["center"]=[round((p["max"][k]+p["min"][k])/2,5) for k in range(3)]
        p["surfaceArea"]=round(p["surfaceArea"],6)
    return {"totalIslands":len(ranked),"topBySurfaceArea":ranked[:top_n],
        "warning":"Connected islands are geometric regions, NOT validated magazines, stocks, or in-game attachment pivots."}

geometry_islands={}
for obj in bpy.data.objects:
    if obj.type=="MESH":
        geometry_islands[obj.name]=inspect_connected_islands(obj)
print("AKM_ISLAND_ANALYSIS",json.dumps({
    name:{"count":info["totalIslands"],"top":info["topBySurfaceArea"][:20]}
    for name,info in geometry_islands.items()
},ensure_ascii=False))

images=[{
    "name":im.name,
    "width":int(im.size[0]),
    "height":int(im.size[1]),
    "packed":bool(im.packed_file),
    "path":im.filepath
} for im in bpy.data.images if im.source!="GENERATED"]
patterns={
    "magazine":r"(magaz|mag[_ .]|clip|ammo)",
    "stock":r"(stock|butt)",
    "barrel":r"(barrel|muzzle)",
    "handguard":r"(handguard|forearm|foregrip)",
    "optic":r"(optic|sight|scope|rail)"
}
candidates={key:[m["name"] for m in meshes if re.search(pattern,m["name"],re.I)]
    for key,pattern in patterns.items()}
report={
    "source":"https://opengameart.org/content/weathered-akm-rifle",
    "creator":"LonesomeDucky",
    "license":"CC0 1.0 Universal",
    "inspectionTool":"bpy 4.5.15, embedded .blend Python scripts disabled",
    "model_kind":"unreviewed independent CC0 Blender conversion, attachment segmentation unknown",
    "mesh_count":len(meshes),
    "meshes":meshes,
    "materials":sorted(materials),
    "images":images,
    "connected_islands":geometry_islands,
    "part_candidates":candidates,
    "warning":"Names are guesses, no real mount socket or game mod compatibility established."
}
(output/"inspection.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
if not meshes: raise RuntimeError("No meshes in source")
print("AKM_INSPECTION_SUMMARY",json.dumps({
    "meshCount":len(meshes),"imageCount":len(images),"mesh_names":[m["name"] for m in meshes[:80]],
    "part_candidates":candidates
},ensure_ascii=False))
bpy.ops.export_scene.gltf(
    filepath=str(output/"akm.glb"),
    export_format="GLB",
    export_materials="EXPORT",
    export_texcoords=True,
    export_normals=True,
    export_apply=False
)
assert (output/"akm.glb").is_file()
print("GLB export complete", (output/"akm.glb").stat().st_size)
