import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveBuild} from "../src/engine.mjs";
import {auditAttachments,assessAttachment} from "../src/data-governance.mjs";

const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const weapon=json("../data/weapons/akm.json");
const all=json("../data/attachments/akm-sample.json");
const mags=all.filter(a=>a.slot==="magazine");
const expected=[
 ["akm-polymer-30-mag",13120000313,30,4,0.13,1,1,2,false],
 ["akm-40-mag",13120000239,40,-8,0.17,1,2,3,true],
 ["akm-70-drum",13120000241,70,-15,0.32,2,2,3,true]
];
test("2026 AKM magazine metadata all has checked source/date and correct capacity override",()=>{
 assert.equal(mags.length,3);
 for(const [id,objectId,capacity,handling,weight,w,h,rarity,penalty] of expected){
  const p=mags.find(a=>a.id===id);
  assert.ok(p,id);assert.equal(p.objectId,objectId);
  assert.deepEqual(p.effects,{handling,magazineCapacity:capacity});
  assert.deepEqual(p.magazineDetails.inventoryCells,[w,h]);
  assert.equal(p.magazineDetails.weightKg,weight);
  assert.equal(p.magazineDetails.rarityGrade,rarity);
  assert.equal(p.magazineDetails.quickDetach,true);
  assert.equal(p.magazineDetails.reloadTimePenalty,penalty);
  assert.equal(p.magazineDetails.capacityRounds,capacity);
  assert.match(p.source,/^https:\/\/gamegrids\.io/);
  assert.ok(p.secondarySources.some(u=>u.startsWith("https://deltaforcetools.gg/")));
  assert.equal(p.dataAsOf,"2026-09-23");
  assert.equal(p.dataStatus,"community-unverified");
  assert.equal(p.lastChecked,"2026-10-24");
  assert.equal(p.marketSnapshot.currency,"哈夫幣");
  assert.match(p.marketSnapshot.observedAt,/^2026-\d\d-\d\d$/);
  assert.equal(p.platformValidated,false);
  assert.equal(p.parameterValidated,false);
  assert.equal(assessAttachment(p,"akm").verified,false);
  const result=resolveBuild(weapon,all,{magazine:id});
  assert.equal(result.stats.magazineCapacity,capacity,"Capacity is absolute, not 30+capacity");
  assert.equal(result.stats.handling,54+handling);
  const strict=()=>resolveBuild(weapon,all,{magazine:id},{mode:"verified"});
  assert.throws(strict,/嚴格模式拒絕/);
 }
});
test("all historical effects retained for traceability; archive no longer displayed as current 2026 data",()=>{
 for(const p of mags){
  assert.equal(p.historicalComparison.asOf,"2024-12-21");
  assert.deepEqual(p.historicalComparison.effects,p.effects);
 }
 assert.equal(auditAttachments(weapon,all).issues.length,0);
});
test("AK762 wood candidate is quarantined, not silently fit to AKM",()=>{
 const q=json("../data/research/akm-magazine-quarantine-2026.json");
 const p=q.candidates[0];
 assert.equal(p.objectId,13120000240);
 assert.equal(p.researchOnly,true);
 assert.equal(p.excludedFromBuildCalculations,true);
 assert.equal(p.fitmentVerified,false);
 assert.ok(!all.some(a=>a.objectId===p.objectId));
 assert.throws(()=>resolveBuild(weapon,all,{magazine:p.id}),/不相容/);
});
test("UI distinguishes archived market price and magazine stat fields from validated performance",()=>{
 const ui=readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8");
 assert.match(ui,/option-magazine-meta/);
 assert.match(ui,/option-magazine-market/);
 assert.match(ui,/非即時/);
 assert.match(ui,/2026 社群資料 · 未經手遊逐件核驗/);
});
