/**
 * ACFH 2.2 / real mesh topology review. Geometry and game fitment are separate.
 * An independent mesh can be inspected. It is NOT proof that arbitrary item IDs
 * may be fitted, and does not establish a replacement variant.
 */
export const AKM_MESH_REVIEW=Object.freeze({
 assetPath:"./assets/models/akm-parts-candidate.glb",
 creator:"LonesomeDucky",
 license:"CC0 1.0 Universal",
 source:"https://opengameart.org/content/weathered-akm-rifle",
 sourceData:"./assets/models/akm-parts-candidate.json",
 expectedMeshes:2,
 expectedMaterials:1,
 verifiedMeshNames:Object.freeze(["AKM_Body","AKM_Magazine"]),
 independentPartMeshes:Object.freeze({magazine:"AKM_Magazine"}),
 missingPartSlots:Object.freeze(["muzzle","barrel","stock","reargrip","foregrip","handguard","optic"]),
 note:"僅確認彈匣幾何獨立，不保證遊戲相容、槍托或槍口有可換的網格"
});
export function inspectRenderableTopology(meshes,review=AKM_MESH_REVIEW){
 if(!Array.isArray(meshes))throw new TypeError("Expected renderable mesh array");
 const names=meshes.filter(obj=>obj&&obj.isMesh).map(obj=>obj.name);
 const unique=new Set(names),expected=review.verifiedMeshNames;
 const actualMatch=names.length===review.expectedMeshes&&names.every(name=>unique.has(name))&&
  unique.size===expected.length&&expected.every(name=>unique.has(name));
 const partStatus=Object.fromEntries(Object.entries(review.independentPartMeshes).map(([slot,name])=>
  [slot,{independent:actualMatch&&names.includes(name),meshName:actualMatch&&names.includes(name)?name:null,hasReplacementGeometry:false}]));
 for(const slot of review.missingPartSlots)partStatus[slot]={
  independent:false,meshName:null,hasReplacementGeometry:false
 };
 return {meshCount:names.length,nodeNames:names,reviewed:actualMatch,parts:partStatus,
  swappableSlots:[],reason:actualMatch?
   "僅能檢視獨立彈匣。沒有任何可替換的槍口、槍托或彈匣型號模型。":
   "網格拓樸與稽核版不同，禁止宣稱任何零件已分離。"};
}
export function canIsolateMesh(topology,slot){
 return Boolean(topology?.reviewed&&topology.parts?.[slot]?.independent&&slot==="magazine");
}
export function canSwapAttachmentModel(topology,slot){
 return Boolean(topology?.reviewed&&topology.parts?.[slot]?.independent&&
  topology.parts[slot].hasReplacementGeometry===true);
}
