import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 AKM_MESH_REVIEW,inspectRenderableTopology,canIsolateMesh,canSwapAttachmentModel
} from "../src/model-topology.mjs";
import {parseGLBTopology,auditShippedAssets} from "../scripts/audit-segmented-glb.mjs";

test("real independently-reviewed meshes cannot be confused with source game attachment support",()=>{
 const reviewed=inspectRenderableTopology([
  {name:"AKM_Body",isMesh:true},{name:"AKM_Magazine",isMesh:true}
 ]);
 assert.equal(reviewed.reviewed,true);
 assert.equal(reviewed.parts.magazine.independent,true);
 assert.equal(reviewed.parts.stock.independent,false);
 assert.equal(reviewed.parts.muzzle.independent,false);
 assert.equal(reviewed.parts.foregrip.independent,false);
 assert.deepEqual(reviewed.swappableSlots,[]);
 assert.equal(canIsolateMesh(reviewed,"magazine"),true);
 for(const part of ["muzzle","stock","magazine","barrel","handguard"]){
  assert.equal(canSwapAttachmentModel(reviewed,part),false,
    "No alternate game-accurate physical meshes have been audited: "+part);
 }
 assert.deepEqual(AKM_MESH_REVIEW.verifiedMeshNames,["AKM_Body","AKM_Magazine"]);
});
test("renaming, missing or extra meshes invalidates geometry approval",()=>{
 const fixtures=[
  [{name:"AKM_Body",isMesh:true}],
  [{name:"AKM_Body",isMesh:true},{name:"AKM_fake_stock",isMesh:true}],
  [{name:"AKM_Magazine",isMesh:true},{name:"AKM_Magazine",isMesh:true}],
  [{name:"AKM_Body",isMesh:true},{name:"AKM_Magazine",isMesh:true},{name:"AKM_Stock",isMesh:true}],
  [{name:"AKM_Body",isMesh:true},{name:"AKM_Magazine",isMesh:false}]
 ];
 for(const nodes of fixtures){
  const inspected=inspectRenderableTopology(nodes);
  assert.equal(inspected.reviewed,false);
  assert.equal(canIsolateMesh(inspected,"magazine"),false);
  assert.deepEqual(inspected.swappableSlots,[]);
 }
});
test("GLB integrity report checks hash, licensed source and true physical geometry",()=>{
 const report=auditShippedAssets();
 assert.equal(report.reports.length,2);
 const original=report.reports.find(x=>x.file==="akm.glb");
 const segmented=report.reports.find(x=>x.file==="akm-parts-candidate.glb");
 assert.equal(original.meshCount,1);
 assert.equal(segmented.meshCount,2);
 assert.equal(segmented.materialCount,1);
 assert.equal(segmented.magazineIndependent,true);
 assert.equal(segmented.stockIndependent,false);
 assert.equal(segmented.muzzleIndependent,false);
 assert.equal(segmented.verifiedReplacementVariants,0);
 assert.equal(segmented.readyForUserSelected3DSwaps,false);
 assert.ok(segmented.bytes>500000);
 assert.ok(segmented.triangleCount>1000);
 assert.ok(segmented.triangleCount<500000,"Reject implausible geometry in mobile asset");
 for(const r of report.reports){
  assert.match(r.sha256,/^[a-f0-9]{64}$/);
  assert.equal(r.license,"CC0 1.0 Universal");
  assert.ok(r.materialCount>=1);
  assert.ok(r.meshNodes.length>=1);
 }
});
test("malformed GLB and invalid node indices cannot be called a reviewed mesh",()=>{
 const bytes=readFileSync(new URL("../assets/models/akm.glb",import.meta.url));
 assert.throws(()=>parseGLBTopology(Buffer.from("not-a-glb")),/Invalid GLB/);
 const tampered=Buffer.from(bytes);tampered.writeUInt32LE(0,8);
 assert.throws(()=>parseGLBTopology(tampered),/Invalid GLB/);
});
test("3D viewer exposes real-only geometry audit and reversible isolation controls",()=>{
 const viewer=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/model-reference.mjs",import.meta.url),"utf8");
 assert.match(viewer,/inspectRenderableTopology\(meshes\)/);
 assert.match(viewer,/canIsolateMesh\(topology,slot\)/);
 assert.match(viewer,/body\.visible=!isolatedMagazine/);
 assert.match(viewer,/canvas\.dataset\.meshIsolation/);
 assert.match(ui,/檢查 3D 分件/);
 assert.match(ui,/單看彈匣幾何/);
 assert.match(ui,/還原全槍幾何/);
 assert.match(ui,/可真正替換的配件型號/);
 assert.match(ui,/原始 3D 作者與 CC0 授權/);
 assert.match(ui,/3D 模型未隨配件更換/);
});
