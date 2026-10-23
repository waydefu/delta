/**
 * P1 binary GLB + source provenance integrity check.
 * This runs in ordinary Node: no Blender, network or graphics driver needed.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
export function inspectGLB(input){
 const bytes=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(bytes.length<28||bytes.toString("utf8",0,4)!=="glTF"||bytes.readUInt32LE(4)!==2||
    bytes.readUInt32LE(8)!==bytes.length)throw new TypeError("Invalid GLB 2.0 header");
 const length=bytes.readUInt32LE(12),type=bytes.toString("utf8",16,20);
 if(type!=="JSON"||length===0||20+length>bytes.length)throw new TypeError("Invalid glTF JSON chunk");
 let json;
 try{json=JSON.parse(bytes.toString("utf8",20,20+length));}
 catch{throw new TypeError("Malformed glTF JSON");}
 if(json.asset?.version!=="2.0"||!Array.isArray(json.meshes)||!json.meshes.length||!Array.isArray(json.materials))
  throw new TypeError("Missing glTF 2.0 asset meshes or materials");
 const materials=json.materials.map((m,index)=>({
  index,name:m.name??"",
  metallicFactor:m.pbrMetallicRoughness?.metallicFactor??1,
  roughnessFactor:m.pbrMetallicRoughness?.roughnessFactor??1,
  hasRoughnessTexture:Boolean(m.pbrMetallicRoughness?.metallicRoughnessTexture),
  hasBaseColorTexture:Boolean(m.pbrMetallicRoughness?.baseColorTexture),
  normalTexture:Boolean(m.normalTexture)
 }));
 return {
  byteLength:bytes.length,meshCount:json.meshes.length,
  materialCount:json.materials.length,
  imageCount:json.images?.length||0,
  extensionsUsed:json.extensionsUsed||[],
  materials,
  meshPrimitives:json.meshes.map(m=>m.primitives?.length||0)
 };
}
export function verifyModelFiles(glbPath="assets/models/akm.glb",provenancePath="assets/models/akm-provenance.json"){
 const buffer=readFileSync(glbPath);
 const proof=JSON.parse(readFileSync(provenancePath,"utf8"));
 const digest=createHash("sha256").update(buffer).digest("hex");
 if(digest!==proof.webSha256||buffer.length!==proof.bytes)throw new Error("AKM asset SHA256/size mismatch");
 if(proof.license!=="CC0 1.0 Universal"||proof.source!=="https://opengameart.org/content/weathered-akm-rifle")
  throw new Error("AKM asset attribution changed");
 const parsed=inspectGLB(buffer);
 if(parsed.meshCount!==proof.meshCount||proof.separablePartsVerified!==0)
  throw new Error("Asset structure differs from approved single-mesh report");
 return {provenance:proof,asset:parsed};
}
if(process.argv[1]&&new URL("file://"+process.argv[1]).href===import.meta.url){
 console.log("P1_ASSET_INTEGRITY",JSON.stringify(verifyModelFiles(),null,2));
}
