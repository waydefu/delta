import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveBuild} from "../src/engine.mjs";
import {auditAttachments,assessAttachment} from "../src/data-governance.mjs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const weapon=JSON.parse(read("../data/weapons/akm.json"));
const all=JSON.parse(read("../data/attachments/akm-sample.json"));
const newIDs=[
 "sandstorm-vertical-compensator","titan-suppressor","titan-compensator",
 "bastion-horizontal-compensator","ffc-dual-flow-brake","pbs-russian-suppressor",
 "whisper-tactical-suppressor","practical-flash-hider","steel-muzzle-brake",
 "titanium-competition-brake","advanced-multi-caliber-suppressor",
 "pt1-special-stock","mrgs-skeleton-stock","pt3-deathrider-stock"
];
test("2026 sourced AKM research coverage: 13 muzzle, 7 stock, 35 total",()=>{
 assert.equal(all.length,35);
 assert.equal(all.filter(x=>x.slot==="muzzle").length,13);
 assert.equal(all.filter(x=>x.slot==="stock").length,7);
 assert.equal(new Set(all.map(x=>x.objectId)).size,35);
 assert.equal(new Set(all.map(x=>x.id)).size,35);
 assert.equal(auditAttachments(weapon,all).issues.length,0);
});
test("all 14 additions have stable item IDs, dated individual sources and explicit research-only evidence status",()=>{
 for(const id of newIDs){
  const x=all.find(y=>y.id===id);
  assert.ok(x,id);assert.ok(Number.isSafeInteger(x.objectId));
  assert.match(x.source,/^https:\/\/gamegrids\.io\/delta-force\/zh\/attachments\//);
  assert.equal(x.dataAsOf,"2026-09-23");
  assert.equal(x.lastChecked,"2026-10-24");
  assert.equal(x.dataStatus,"community-unverified");
  assert.equal(x.platformValidated,false);
  assert.equal(x.parameterValidated,false);
  assert.equal(x.fitmentEvidence.status,"candidate");
  assert.equal(x.effectEvidence.formulaValidated,false);
  assert.equal(assessAttachment(x,"akm").verified,false);
  const result=resolveBuild(weapon,all,{[x.slot]:x.id});
  assert.equal(result.compatibilityProvisional,true);
  assert.throws(()=>resolveBuild(weapon,all,{[x.slot]:x.id},{mode:"verified"}),/嚴格模式拒絕/);
 }
});
test("named AKM build candidates and selected stat values are correctly represented",()=>{
 const lookup=id=>all.find(x=>x.id===id);
 assert.deepEqual(lookup("sandstorm-vertical-compensator").effects,{recoilControl:9});
 assert.equal(lookup("sandstorm-vertical-compensator").fitmentEvidence.scope.startsWith("AKM build"),true);
 assert.deepEqual(lookup("mrgs-skeleton-stock").effects,{handling:4,aimStability:6,hipFireAccuracy:-8});
 assert.deepEqual(lookup("titan-suppressor").effects,{recoilControl:16,handling:-8,aimStability:4,hipFireAccuracy:-16});
 assert.deepEqual(lookup("pt1-special-stock").effects,{recoilControl:8,handling:4,aimStability:-4});
 assert.deepEqual(lookup("advanced-multi-caliber-suppressor").effects,
   {recoilControl:9,handling:-6,hipFireAccuracy:-4,effectiveRangePct:18,muzzleVelocityPct:18});
});
test("picker search does not create or imply an AKM verified compatibility upgrade",()=>{
 const ui=read("../src/gunsmith.mjs");
 const css=read("../assets/main.css");
 assert.match(ui,/bench-option-search/);
 assert.match(ui,/搜尋.*配件/);
 assert.match(ui,/僅按通用槽位推算 · AKM 相容待核/);
 assert.match(ui,/相容待核驗/);
 assert.match(css,/\.bench-option\[hidden\]\{display:none!important\}/);
});
