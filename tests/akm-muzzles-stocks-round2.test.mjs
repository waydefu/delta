import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveBuild} from "../src/engine.mjs";
import {auditAttachments,assessAttachment} from "../src/data-governance.mjs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const data=JSON.parse(read("../data/attachments/akm-sample.json"));
const weapon=JSON.parse(read("../data/weapons/akm.json"));
const added=[
 ["birdcage-flash-hider",13130000178,"muzzle",{recoilControl:2,aimStability:1},0.71,2],
 ["ember-suppressor",13130000182,"muzzle",{recoilControl:10,handling:-4,aimStability:4,hipFireAccuracy:-8},0.8,4],
 ["ops-suppressor",13130000201,"muzzle",{recoilControl:10,handling:-8,aimStability:-3},0.7,3],
 ["ak19-stock",13040000182,"stock",{recoilControl:6,handling:4,aimStability:-2,hipFireAccuracy:-8},0.1,3],
 ["qr-high-performance-rear-stock",13040000225,"stock",{recoilControl:3,handling:-2,aimStability:3,hipFireAccuracy:16},0.53,2],
 ["practical-tactical-stock",13040000105,"stock",{recoilControl:4},0.54,2],
 ["practical-stable-stock",13040000104,"stock",{recoilControl:2},0.53,2],
 ["practical-lightweight-stock",13040000106,"stock",{handling:2},0.47,2],
 ["core-rail-stock",13040000009,"stock",{recoilControl:2,handling:2},0.47,2],
 ["ur-special-tactical-stock",13040000110,"stock",{recoilControl:8,handling:-4,aimStability:4},0.52,4]
];
test("Round 2 has 45 unique AKM candidates with source-based subslot counts",()=>{
 assert.equal(data.length,45);
 assert.equal(data.filter(x=>x.slot==="muzzle").length,16);
 assert.equal(data.filter(x=>x.slot==="stock").length,14);
 assert.equal(new Set(data.map(x=>x.id)).size,data.length);
 assert.equal(new Set(data.map(x=>x.objectId)).size,data.length);
 assert.equal(auditAttachments(weapon,data).issues.length,0);
 const coverage=JSON.parse(read("../data/research/akm-coverage.json"));
 assert.equal(coverage.akmCurated,45);
 assert.equal(coverage.verifiedCurrentMobileAttachments,0);
 assert.equal(coverage.coverageBySlot.stock,14);
});
test("All 10 new parts retain individually sourced IDs, modifiers and uncertainty",()=>{
 for(const [id,objectId,slot,effects,weight,grade] of added){
  const a=data.find(x=>x.id===id);
  assert.ok(a,id);
  assert.equal(a.objectId,objectId);
  assert.equal(a.slot,slot);
  assert.deepEqual(a.effects,effects);
  assert.equal(a.accessoryDetails.weightKg,weight);
  assert.equal(a.accessoryDetails.rarityGrade,grade);
  assert.equal(a.dataStatus,"community-unverified");
  assert.equal(a.dataAsOf,"2026-09-23");
  assert.equal(a.lastChecked,"2026-10-24");
  assert.equal(a.platformValidated,false);
  assert.equal(a.parameterValidated,false);
  assert.equal(a.fitmentEvidence.status,"candidate");
  assert.equal(a.fitmentEvidence.checkedAt,null);
  assert.equal(a.effectEvidence.formulaValidated,false);
  assert.match(a.source,/^https:\/\/gamegrids\.io\/delta-force\/zh\/attachments\//);
  assert.equal(assessAttachment(a,"akm").verified,false);
  const modeled=resolveBuild(weapon,data,{[slot]:id});
  assert.ok(modeled.compatibilityProvisional);
  for(const [key,value] of Object.entries(effects)){
   assert.equal(modeled.deltas[key],value,"Research delta for "+id+" "+key);
  }
  assert.throws(()=>resolveBuild(weapon,data,{[slot]:id},{mode:"verified"}),/嚴格模式拒絕/);
 }
});
test("AK Stock Recoil Pad is research-only; guessed parent mount must not unlock it",()=>{
 const a=data.find(x=>x.id==="ak-recoil-buttpad");
 const audit=JSON.parse(read("../data/research/akm-stock-mount-audit.json"));
 assert.ok(a&&a.researchOnly);
 assert.equal(a.objectId,audit.confirmed.objectId);
 assert.equal(a.mountValidation,"unresolved");
 assert.equal(audit.enforcement.canEquip,false);
 assert.equal(audit.enforcement.canApplyStatEffects,false);
 assert.ok(audit.unresolved.every(x=>x.status==="not-verified"));
 assert.throws(()=>resolveBuild(weapon,data,{buttpad:a.id}),/僅供研究|未確認可直接掛載/);
});
