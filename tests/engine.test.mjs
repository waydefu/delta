import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveBuild, idealFlightTimeMs, idealUnarmoredTtkMs } from "../src/engine.mjs";
const weapon = JSON.parse(readFileSync(new URL("../data/weapons/akm.json",import.meta.url)));
const attachments = JSON.parse(readFileSync(new URL("../data/attachments/akm-sample.json",import.meta.url)));
test("裸槍屬性不變", () => {
 const r=resolveBuild(weapon,attachments,{});
 assert.equal(r.stats.recoilControl,39);
 assert.equal(r.stats.handling,54);
 assert.equal(r.stats.muzzleVelocityMps,525);
 assert.equal(r.stats.effectiveRangeM,40);
});
test("AKM 性能槍管的已知欄位加成", () => {
 const s=resolveBuild(weapon,attachments,{barrel:"akm-performance-barrel"}).stats;
 assert.deepEqual([s.recoilControl,s.handling,s.aimStability,s.hipFireAccuracy],[41,56,57,57]);
 assert.equal(s.effectiveRangeM,42.4);
 assert.equal(s.muzzleVelocityMps,556.5);
});
test("多配件疊加應標示假設模型", () => {
 const r=resolveBuild(weapon,attachments,{barrel:"akm-long-barrel",muzzle:"ak-suppressor",stock:"ak-folding-stock"});
 assert.deepEqual([r.stats.recoilControl,r.stats.handling,r.stats.aimStability,r.stats.hipFireAccuracy],[50,50,61,33]);
 assert.equal(r.stats.effectiveRangeM,59.2);
 assert.equal(r.stats.muzzleVelocityMps,777);
 assert.match(r.calculationStatus,/假設/);
 assert.equal(r.compatibilityProvisional,true);
});
test("錯槽、未知配件與未知規則不能靜默通過", () => {
 assert.throws(()=>resolveBuild(weapon,attachments,{muzzle:"akm-performance-barrel"}),/不相容/);
 assert.throws(()=>resolveBuild(weapon,attachments,{barrel:"not-exist"}),/不相容/);
 assert.throws(()=>resolveBuild(weapon,attachments,{optics:"ak-folding-stock"}),/未知槽位/);
});
test("理想時間與純理論 TTK", () => {
 assert.equal(idealFlightTimeMs(105,525),200);
 assert.equal(idealUnarmoredTtkMs(40,600),200);
 assert.throws(()=>idealFlightTimeMs(100,0),RangeError);
 assert.throws(()=>idealUnarmoredTtkMs(0,600),RangeError);
});
test("資料符合唯一 id 與每個效果皆可計算", () => {
 assert.equal(new Set(attachments.map(x=>x.id)).size,attachments.length);
 for(const a of attachments){
  assert.ok(a.source.startsWith("https://"));
  assert.ok(a.compatibleWeapons.includes("akm"));
  resolveBuild(weapon,attachments,{[a.slot]:a.id});
 }
});

test("玩家實機截圖對照：裸槍值一致", () => {
 const detail=JSON.parse(readFileSync(new URL("../data/weapons/akm-details.json",import.meta.url)));
 for(const [key,value] of Object.entries(detail.base)) assert.equal(weapon.base[key],value,key);
 assert.equal(detail.observedSlots.length,11);
 assert.ok(detail.groups.some(g=>g.id==="handling"&&g.values.some(([k,v])=>k==="開鏡時間"&&v==="327 ms")));
 assert.ok(detail.groups.some(g=>g.id==="hipfire"&&g.values.some(([k,v])=>v==="2.33°")));
});
test("改槍台及詳細屬性元件皆可匯入",async()=>{
 const gun=await import("../src/gunsmith.mjs");
 const detail=await import("../src/details.mjs");
 assert.equal(typeof gun.initGunsmith,"function");
 assert.equal(typeof detail.initDetails,"function");
});
