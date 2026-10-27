/**
 * Binary GLB topology + source evidence audit.
 * Pure Node, no downloaded images, no Three.js, no GPU, no network.
 * This deliberately DOES NOT infer AKM game-mount compatibility from names.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";

export function parseGLBTopology(buffer){
 const bytes=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer);
 if(bytes.length<28||bytes.toString("ascii",0,4)!=="glTF"||
    bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)
  throw new Error("Invalid GLB binary header");
 const length=bytes.readUInt32LE(12);
 if(bytes.toString("ascii",16,20)!=="JSON"||length<10||20+length>bytes.length)
  throw new Error("GLB JSON chunk invalid");
 let data;
 try{data=JSON.parse(bytes.toString("utf8",20,20+length));}
 catch{throw new Error("GLB JSON cannot be decoded");}
 if(data.asset?.version!=="2.0"||!Array.isArray(data.nodes)||
    !Array.isArray(data.meshes)||!Array.isArray(data.accessors))
  throw new Error("GLB missing required glTF arrays");
 const nodes=data.nodes.filter(n=>Number.isInteger(n.mesh)).map(n=>({
  name:n.name||"",mesh:n.mesh,meshName:data.meshes[n.mesh]?.name||""
 }));
 if(nodes.some(n=>!data.meshes[n.mesh]))throw new Error("GLB node references missing mesh");
 const meshNames=data.meshes.map((m,i)=>m.name||"unnamed-"+i);
 let triangles=0,unknownPrimitives=0;
 for(const mesh of data.meshes){
  for(const primitive of mesh.primitives||[]){
   const count=Number.isInteger(primitive.indices)?
    data.accessors[primitive.indices]?.count:
    data.accessors[primitive.attributes?.POSITION]?.count;
   if(!Number.isSafeInteger(count)||count<3){unknownPrimitives++;continue;}
   switch(primitive.mode??4){
    case 4:triangles+=Math.floor(count/3);break;
    case 5:case 6:triangles+=count-2;break;
    default:unknownPrimitives++;
   }
  }
 }
 return {
  bytes:bytes.length,meshCount:data.meshes.length,meshNames,
  meshNodes:nodes,materialCount:data.materials?.length||0,
  images:data.images?.length||0,textures:data.textures?.length||0,
  triangleCount:triangles,unknownPrimitives,
  extensions:data.extensionsUsed||[],
  hasNormals:data.meshes.some(m=>(m.primitives||[]).some(p=>Number.isInteger(p.attributes?.NORMAL))),
  hasTangents:data.meshes.some(m=>(m.primitives||[]).some(p=>Number.isInteger(p.attributes?.TANGENT)))
 };
}
export function auditShippedAssets(dir=resolve(dirname(fileURLToPath(import.meta.url)),"..")){
 const base=resolve(dir,"assets/models");
 const items=[
  {file:"akm.glb",meta:"akm-provenance.json",role:"licensed-baseline"},
  {file:"akm-parts-candidate.glb",meta:"akm-parts-candidate.json",role:"two-mesh-inspection"}
 ];
 const reports=items.map(item=>{
  const contents=readFileSync(resolve(base,item.file));
  const proof=JSON.parse(readFileSync(resolve(base,item.meta),"utf8"));
  const sha256=createHash("sha256").update(contents).digest("hex");
  if(contents.length!==proof.bytes||sha256!==proof.webSha256)
   throw new Error(item.file+": size/SHA256 mismatch");
  if(proof.source!=="https://opengameart.org/content/weathered-akm-rifle"||
     proof.license!=="CC0 1.0 Universal")throw new Error(item.file+": unreviewed provenance");
  const topology=parseGLBTopology(contents);
  if(topology.meshCount!==proof.meshCount)throw new Error(item.file+": inconsistent mesh count");
  if(item.role==="two-mesh-inspection"){
   // Three.js exposes scene NODE names; glTF's mesh-array names are separate.
   const byName=new Map(topology.meshNodes.map(n=>[n.name,n.mesh]));
   const body=byName.get("AKM_Body"),magazine=byName.get("AKM_Magazine");
   if(!Number.isInteger(body)||!Number.isInteger(magazine)||body===magazine||
      !topology.meshNames[body]||!topology.meshNames[magazine])
    throw new Error(item.file+": independent named SCENE nodes absent; "+JSON.stringify(topology.meshNodes));
  }
  return {file:item.file,role:item.role,sha256,license:proof.license,
   ...topology,
   stockIndependent:false,muzzleIndependent:false,
   magazineIndependent:item.role==="two-mesh-inspection",
   verifiedReplacementVariants:0,
   readyForUserSelected3DSwaps:false};
 });
 return {auditedAt:"2026-10-27",reports};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=auditShippedAssets();
 console.log("AKM_GLB_TOPOLOGY_AUDIT",JSON.stringify(report));
}
