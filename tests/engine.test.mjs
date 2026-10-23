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

test("前端使用的靜態 ID 在 HTML 全部存在，避免初始化中斷", () => {
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 const ids=[...js.matchAll(/setText\("([a-z0-9-]+)"/g)].map(x=>x[1]);
 for(const id of ids) assert.ok(html.includes('id="'+id+'"'),"Missing DOM element: "+id);
});

test("父槽位提供子槽位，拆掉父配件後自動卸除子孫",async()=>{
 const {getAvailableSlots,reconcileSelection}=await import("../src/attachment-graph.mjs");
 const fakeWeapon={id:"test",openSlots:["barrel"]};
 const fake=[
  {id:"barrel-a",slot:"barrel",compatibleWeapons:["test"],providesSlots:["rail"]},
  {id:"rail-a",slot:"rail",compatibleWeapons:["test"],providesSlots:["optic"]},
  {id:"optic-a",slot:"optic",compatibleWeapons:["test"]}
 ];
 const initial={barrel:"barrel-a",rail:"rail-a",optic:"optic-a"};
 assert.deepEqual([...getAvailableSlots(fakeWeapon,fake,initial)].sort(),["barrel","optic","rail"]);
 const changed=reconcileSelection(fakeWeapon,fake,{...initial,barrel:""});
 assert.deepEqual(changed.selected,{barrel:""});
 assert.equal(changed.removed.length,2);
 assert.deepEqual([...changed.openSlots],["barrel"]);
});
test("不存在的子槽不能裝，且拒絕不相容的配件",async()=>{
 const {reconcileSelection}=await import("../src/attachment-graph.mjs");
 const w={id:"test",openSlots:["barrel"]};
 const a=[{id:"optic",slot:"optic",compatibleWeapons:["test"]},{id:"foreign",slot:"barrel",compatibleWeapons:["other"]}];
 const result=reconcileSelection(w,a,{barrel:"foreign",optic:"optic"});
 assert.deepEqual(result.selected,{});
 assert.equal(result.removed.length,2);
});
test("premium UI 需要的視覺化容器均存在",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 for(const id of ["gunsmith-workbench","mount-graph","contribution-viz","flight-chart"]){
  assert.ok(html.includes('id="'+id+'"'),"Missing UI block: "+id);
 }
});

test("動效模組可在無 DOM 的 Node 環境匯入",async()=>{
 const m=await import("../src/motion.mjs");
 assert.equal(m.getMotionPreference(),"system");
 assert.equal(m.shouldAnimate(),true);
 assert.throws(()=>m.setMotionPreference("fast"),TypeError);
 assert.equal(typeof m.sheetExit,"function");
});
test("動效切換鈕連接到 HTML 及 JS",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const js=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 assert.match(html,/id="motion-toggle"/);
 assert.match(js,/setupMotionToggle/);
});

test("槍械側面示意圖應保留校準比例與明示來源",()=>{
 const geo=JSON.parse(readFileSync(new URL("../data/weapons/akm-geometry.json",import.meta.url)));
 const svg=readFileSync(new URL("../assets/akm-side.svg",import.meta.url),"utf8");
 assert.equal(geo.physical.overallLengthMm,880);
 assert.equal(geo.physical.barrelLengthMm,415);
 assert.ok(Math.abs(geo.physical.barrelRatio-(415/880))<.001);
 assert.deepEqual(geo.outline.viewBox,[0,0,1000,420]);
 assert.match(svg,/preserveAspectRatio="xMidYMid meet"/);
 assert.match(svg,/id="receiver-assembly"/);
 assert.match(svg,/id="stock-assembly"/);
 const segments=geo.outline.referenceSections;
 for(const name of ["front","receiver","stock"])assert.equal(segments[name].length,2);
 assert.ok(Math.abs(segments.front[1]-segments.receiver[0])<.0001);
 assert.ok(Math.abs(segments.receiver[1]-segments.stock[0])<.0001);
});
test("手機動效、候選配件預覽與動效開關相互連結",()=>{
 const gun=readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8");
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.match(gun,/sheetEntrance\\(drawer\\)/);
 assert.match(gun,/sheetExit\\(drawer\\)/);
 assert.match(gun,/touchend/);
 assert.match(gun,/candidate-preview/);
 assert.match(html,/id="motion-toggle"/);
 assert.match(html,/motion-v05\\.css/);
});
