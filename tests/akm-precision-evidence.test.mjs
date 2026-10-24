import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parsePrecisionMode,resolvePrecisionView,validatePrecisionCatalog} from "../src/precision.mjs";
import {resolveBuild} from "../src/engine.mjs";

const json=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
const protocol=json("../data/research/akm-precision-protocol.json");
const archive=json("../data/research/akm-precision-observations.json");
const details=json("../data/weapons/akm-details.json");
const weapon=json("../data/weapons/akm.json");
const attachments=json("../data/attachments/akm-sample.json");
const pt=attachments.find(a=>a.id==="pt1-special-stock");

test("schema covers every baseline recoil/stability/hipfire/handling substat without conflating weapon and camera stability",()=>{
 const validated=validatePrecisionCatalog(protocol,archive);
 for(const group of details.groups.filter(g=>g.id!=="damage")){
  const matching=protocol.rawDetailedMetricGroups.find(g=>g.id===group.id);
  assert.ok(matching,group.id);
  for(const [label] of group.values)
   assert.ok(matching.fields.some(([,l])=>l===label),group.id+": "+label);
 }
 assert.ok(validated.known.has("autoVerticalRecoilMultiplier"));
 assert.ok(validated.known.has("autoHorizontalRecoilMultiplier"));
 assert.ok(validated.known.has("weaponFiringStability"));
 assert.ok(validated.known.has("cameraFiringStability"));
 assert.notEqual("weaponFiringStability","cameraFiringStability");
 assert.equal(archive.observations.length,0,"Do not invent tuned field observations");
});
test("unmodified baseline retains actual screenshot values but equipped detailed metrics remain unknown",()=>{
 const baseline=resolvePrecisionView(protocol,archive,[],"default");
 assert.deepEqual(baseline.compareRow("autoHorizontalRecoilMultiplier","1×"),{
  baseline:"1×",default:"1×",tuned:null,defaultStatus:"verified-baseline",tunedStatus:"unknown"
 });
 const modeled=resolveBuild(weapon,attachments,{stock:pt.id});
 assert.equal(modeled.stats.recoilControl,47); // estimates may exist for main-panel score only
 const r=resolvePrecisionView(protocol,archive,modeled.equipped,"compare");
 assert.equal(r.compareRow("autoVerticalRecoilMultiplier","1×").default,null);
 assert.equal(r.compareRow("autoVerticalRecoilMultiplier","1×").tuned,null);
 assert.equal(r.compareRow("weaponFiringStability","1×").default,null);
 assert.equal(r.compareRow("cameraFiringStability","1×").tuned,null);
 assert.equal(r.selectedCount,1);
 assert.equal(r.guides[0].slot,"stock");
 assert.equal(r.guides[0].dimensions.length,2);
 assert.equal(r.anyVerified,false);
 assert.equal(parsePrecisionMode("garbage"),"default");
});
test("exact source check forbids PC/Warfare, wrong build, wrong game version, or unrecorded tuned profile",()=>{
 const fakeProtocol={...protocol,context:{...protocol.context,currentVersion:"verified-S11"}};
 const record={
  weaponId:"akm",platform:"mobile",gameMode:"operations",gameVersion:"verified-S11",
  objectIds:[pt.objectId],calibrationMode:"default",
  evidence:{type:"in-game-screenshot",reference:"test-fixture-only",checkedAt:"2026-10-24"},
  metrics:{autoVerticalRecoilMultiplier:0.88,weaponFiringStability:0.96}
 };
 const fixture=observations=>({observations});
 const measured=resolvePrecisionView(fakeProtocol,fixture([record]),[pt],"default");
 assert.equal(measured.compareRow("autoVerticalRecoilMultiplier","1×").default,"0.88×");
 assert.equal(measured.compareRow("autoHorizontalRecoilMultiplier","1×").default,null);
 for(const change of [
  {platform:"pc"},{gameMode:"warfare"},{gameVersion:"old-S10"},
  {objectIds:[99999]},{evidence:{type:"third-party",reference:"x",checkedAt:"2026-10-24"}},
  {metrics:{nonexistentField:999}}
 ]){
  const wrong=resolvePrecisionView(fakeProtocol,fixture([{...record,...change}]),[pt],"default");
  assert.equal(wrong.compareRow("autoVerticalRecoilMultiplier","1×").default,null);
 }
 const fakeTuned={...record,calibrationMode:"tuned",tuningProfileId:"my-proof",tuningSettings:[{partId:pt.objectId,weight:0.7}]};
 assert.equal(resolvePrecisionView(fakeProtocol,fixture([fakeTuned]),[pt],"tuned").compareRow("weaponFiringStability","1×").tuned,null);
 assert.equal(resolvePrecisionView(fakeProtocol,fixture([fakeTuned]),[pt],"tuned","wrong-proof").compareRow("weaponFiringStability","1×").tuned,null);
 assert.equal(resolvePrecisionView(fakeProtocol,fixture([fakeTuned]),[pt],"tuned","my-proof").compareRow("weaponFiringStability","1×").tuned,"0.96×");
 // Production version is unresolved: fixture must never contaminate live UI.
 assert.equal(resolvePrecisionView(protocol,fixture([record]),[pt],"default").anyVerified,false);
});
test("precision controls appear in details and save view mode separately from arithmetic inputs",()=>{
 const ui=readFileSync(new URL("../src/details.mjs",import.meta.url),"utf8");
 const app=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 assert.match(ui,/精調後/);
 assert.match(ui,/precision\.compareRow/);
 assert.match(ui,/待驗證/);
 assert.match(ui,/精調幅度、可調範圍和效果公式均未核驗/);
 assert.match(app,/params\.set\("tuning",calibrationView\)/);
 assert.match(app,/initialMode:calibrationView/);
 const core=readFileSync(new URL("../src/engine.mjs",import.meta.url),"utf8");
 assert.doesNotMatch(core,/precision|calibration|tuningMode/,"Unverified precision must not be mixed into base score math");
});
