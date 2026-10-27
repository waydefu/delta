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
  if(a.researchOnly!==true)resolveBuild(weapon,attachments,{[a.slot]:a.id});
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
  {id:"barrel-a",slot:"barrel",compatibleWeapons:["test"],platformValidated:true,mountValidation:"verified",fitmentEvidence:{type:"in-game-screenshot",reference:"FIXTURE-BARREL",checkedAt:"2026-10-24",platform:"mobile"},providesSlots:[{slot:"rail",evidence:{type:"in-game-screenshot",reference:"FIXTURE-RAIL",checkedAt:"2026-10-24",platform:"mobile"}}]},
  {id:"rail-a",slot:"rail",compatibleWeapons:["test"],platformValidated:true,mountValidation:"verified",fitmentEvidence:{type:"in-game-screenshot",reference:"FIXTURE-RAIL-BASE",checkedAt:"2026-10-24",platform:"mobile"},providesSlots:[{slot:"optic",evidence:{type:"in-game-screenshot",reference:"FIXTURE-OPTIC",checkedAt:"2026-10-24",platform:"mobile"}}]},
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
 assert.match(gun,/sheetEntrance\(drawer\)/);
 assert.match(gun,/sheetExit\(drawer\)/);
 assert.match(gun,/touchend/);
 assert.match(gun,/candidate-preview/);
 assert.match(html,/id="motion-toggle"/);
 assert.match(html,/main\.css/);
});

test("網站只載入單一整合樣式，防止多層覆寫失控",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const stylesheetLinks=html.match(/<link rel="stylesheet"/g)||[];
 assert.equal(stylesheetLinks.length,1);
 assert.match(html,/assets\/main\.css/);
 const css=readFileSync(new URL("../assets/main.css",import.meta.url),"utf8");
 assert.match(css,/\.detail-layout/);
 assert.match(css,/\.candidate-preview/);
});

test("霧面材質維持槍械幾何與單一生產樣式來源",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const svg=readFileSync(new URL("../assets/akm-side.svg",import.meta.url),"utf8");
 const css=readFileSync(new URL("../assets/main.css",import.meta.url),"utf8");
 assert.match(svg,/id="woodFiber"/);
 assert.match(svg,/id="steelBrushing"/);
 assert.match(svg,/viewBox="0 0 1000 420"/);
 assert.match(css,/MATTE MATERIAL SYSTEM/);
 assert.match(css,/\.bench-gun\s*\{[\s\S]*?filter:drop-shadow/);
 assert.match(html,/href="\.\/assets\/main\.css"/);
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
});

test("彈匣為獨立的正確比例圖層，位於扳機前並向槍口方向彎曲",()=>{
  const gun=readFileSync(new URL("../assets/akm-side.svg",import.meta.url),"utf8");
  const magazine=readFileSync(new URL("../assets/akm-magazine.svg",import.meta.url),"utf8");
  const gunsmith=readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8");
  assert.match(gun,/viewBox="0 0 1000 420"/);
  assert.doesNotMatch(gun,/M481 238 L580 242 Q575 330/);
  assert.match(magazine,/viewBox="0 0 1000 420"/);
  assert.match(magazine,/id="magazine-shell"/);
  assert.match(magazine,/M458 235 L550 239 C543 305 504 359 417 401 L376 381/);
  assert.match(gunsmith,/assets\/akm-magazine\.svg/);
  assert.match(gunsmith,/inspectMagazine\(\)/);
  assert.match(gunsmith,/shouldAnimate\(\)/);
});

test("WebGL2 局部柔光可回退，且在使用者互動才觸發動畫",async()=>{
 const shader=await import("../src/studio-light.mjs");
 assert.equal(typeof shader.attachStudioLight,"function");
 const source=readFileSync(new URL("../src/studio-light.mjs",import.meta.url),"utf8");
 const gun=readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8");
 for(const token of ["webgl2","webglcontextlost","ResizeObserver","IntersectionObserver","visibilitychange","shouldAnimate"]) assert.ok(source.includes(token),token);
 assert.ok(source.includes("Math.min(1360"));
 assert.ok(gun.includes("attachStudioLight(stage)"));
});

test("3D 模型僅載入允許的作者來源，提供授權與退出解除 iframe",async()=>{
 const {MODELS,modelEmbedUrl,initModelReference}=await import("../src/model-reference.mjs");
 assert.equal(typeof initModelReference,"function");
 assert.equal(MODELS.length,2);
 assert.ok(MODELS.every(m=>m.license==="CC BY"&&m.creator&&m.uid.length===32&&m.source.startsWith("https://sketchfab.com/")));
 assert.ok(MODELS.every(m=>modelEmbedUrl(m.uid).endsWith("?autostart=0")));
 assert.throws(()=>modelEmbedUrl("invalid"));
 const js=readFileSync(new URL("../src/model-reference.mjs",import.meta.url),"utf8");
 assert.match(js,/layer\.replaceChildren\(\);sync\(\)/);
 assert.match(js,/allow-scripts allow-same-origin allow-popups allow-forms/);
 assert.match(js,/模型原作者／授權/);
 assert.match(readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8"),/initModelReference\(stage\)/);
});

test("3D 原生檢視器不虛構分件；需本機 GLB 與使用者主動載入",async()=>{
 const {findPartNodes,mountLocalGLB}=await import("../src/local-viewer.mjs");
 assert.equal(typeof mountLocalGLB,"function");
 const result=findPartNodes(["AKM","Magazine.001","Barrel","Grip","buttstock","magazine_socket","Handguard"]);
 assert.deepEqual(result.magazine,["Magazine.001"]);
 assert.deepEqual(result.barrel,["Barrel"]);
 assert.deepEqual(result.stock,["buttstock"]);
 assert.deepEqual(result.handguard,["Handguard"]);
 const source=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 assert.match(source,/GLTFLoader/);
 assert.match(source,/PMREMGenerator/);
 assert.match(source,/enableDamping=false/);
 assert.match(source,/value\.dispose/);
 assert.match(readFileSync(new URL("../index.html",import.meta.url),"utf8"),/three@0\.180\.0/);
});

test("原生 GLB 維持使用者主動載入，2D 首屏不預先探測模型",()=>{
 const src=readFileSync(new URL("../src/model-reference.mjs",import.meta.url),"utf8");
 assert.doesNotMatch(src,/method:"HEAD"/);
 assert.match(src,/nativeButton\.type="button"/);
 assert.match(src,/await import\("\.\/local-viewer\.mjs"\)/);
 assert.match(src,/loadGeneration!==generation/);
 assert.match(src,/clearLocal\(\)/);
});

test("所有 AKM 截圖／第三方辨識槽位都進入結構，未證實拉機柄不可直接裝",async()=>{
 const {SLOTS}=await import("../src/engine.mjs");
 assert.equal(SLOTS.length,11);
 for(const slot of ["barrel","muzzle","optic","canted","magazine","magwell","foregrip","stock","buttpad","reargrip"])assert.ok(weapon.openSlots.includes(slot));
 assert.ok(!weapon.openSlots.includes("charging"));
});
test("AKM 彈匣容量覆寫，不應被當作可加總增益",()=>{
 const polymer=resolveBuild(weapon,attachments,{magazine:"akm-polymer-30-mag"});
 const drum=resolveBuild(weapon,attachments,{magazine:"akm-70-drum"});
 assert.equal(polymer.stats.magazineCapacity,30);
 assert.equal(polymer.stats.handling,58);
 assert.equal(drum.stats.magazineCapacity,70);
 assert.equal(drum.stats.handling,39);
 assert.match(drum.sourceWarnings.join(" "),/尚未經手遊核驗/);
 assert.equal(attachments.find(p=>p.id==="akm-70-drum").historicalComparison.asOf,"2024-12-21");
});
test("歷史配件清單與已研究數值必須明示來源、日期與驗證程度",()=>{
 assert.equal(attachments.length,45);
 for(const x of attachments){
  assert.ok(x.source.startsWith("https://"));
  assert.ok(x.dataAsOf);
  assert.equal(x.platformValidated,false);
  assert.ok(x.dataStatus);
  if(x.researchOnly!==true)resolveBuild(weapon,attachments,{[x.slot]:x.id});
 }
});
test("不能用未確認的掛載槽位或未知效果偷渡配件",()=>{
 assert.throws(()=>resolveBuild(weapon,[...attachments,{id:"unverified",slot:"charging",effects:{recoilControl:10},compatibleWeapons:["akm"]}],{charging:"unverified"}),/未確認可直接掛載/);
 assert.throws(()=>resolveBuild(weapon,[...attachments,{id:"wrongstat",slot:"foregrip",effects:{magicPower:10},compatibleWeapons:["akm"]}],{foregrip:"wrongstat"}),/未知或無效/);
});

test("偵測到兩件跨來源數值衝突且保存完整證據",()=>{
 const audit=JSON.parse(readFileSync(new URL("../data/research/akm-coverage.json",import.meta.url)));
 assert.equal(audit.historicalAccessoryTotal,392);
 assert.equal(audit.akmCurated,attachments.length);
 assert.equal(audit.sourceConflicts.length,2);
 for(const record of audit.sourceConflicts){
  const item=attachments.find(x=>x.objectId===record.objectId);
  assert.ok(item);
  assert.equal(item.dataStatus,"source-conflict");
  assert.deepEqual(item.archiveComparison.effects,record.archive);
  assert.equal(item.platformValidated,false);
 }
});

test("全量配件僅作研究索引，不會冒充 AKM 已確認相容",async()=>{
 const {inspectExternalPart,normalizeResearchCatalog,UPSTREAM}=await import("../src/research-catalog.mjs");
 const part=inspectExternalPart({id:"optic_test",name:"瞄準鏡",slot:"瞄准镜",tier:4,addedHandling:-3,addedAimStability:2});
 assert.equal(part.slot,"瞄具");
 assert.equal(part.flags.compatibleWithAkm,false);
 assert.equal(part.flags.valuesVerified,false);
 assert.equal(part.stats.length,2);
 const unknown=inspectExternalPart({id:"x",name:"測試",slot:"前握把"});
 assert.equal(unknown.flags.noKnownNumericModifiers,true);
 assert.equal(normalizeResearchCatalog([{id:"x",name:"測試",slot:"前握把"},{id:"x",name:"測試",slot:"前握把"}]).length,1);
 assert.match(UPSTREAM.module,/0\.8\.0/);
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.match(html,/id="research-directory"/);
});

test("2026 AKM 新配件須有來源與未驗證標記",()=>{
 const ids=["akm-beaver-barrel","akm-beaver-long-barrel","ak-stable-reargrip","ak-recoil-buttpad"];
 for(const id of ids){
   const item=attachments.find(x=>x.id===id);
   assert.ok(item,id);
   assert.equal(item.dataAsOf,"2026-09-23");
   assert.equal(item.platformValidated,false);
   assert.ok(item.source.startsWith("https://gamegrids.io"));
   if(item.researchOnly!==true)resolveBuild(weapon,attachments,{[item.slot]:item.id});
 }
 assert.equal(resolveBuild(weapon,attachments,{barrel:"akm-beaver-long-barrel"}).stats.muzzleVelocityMps,682.5);
});

test("2026 槍托緩衝墊分類模糊，不能直接當作 AKM 可裝配件",async()=>{
 const pad=attachments.find(x=>x.objectId===13240000006);
 assert.equal(pad.sourceCategory,"stock");
 assert.equal(pad.researchOnly,true);
 assert.equal(pad.mountValidation,"unresolved");
 assert.throws(()=>resolveBuild(weapon,attachments,{buttpad:pad.id}),/僅供研究/);
 const {reconcileSelection}=await import("../src/attachment-graph.mjs");
 const result=reconcileSelection(weapon,attachments,{stock:"ak-polymer-stock",buttpad:pad.id});
 assert.equal(result.selected.stock,"ak-polymer-stock");
 assert.equal(result.selected.buttpad,undefined);
 assert.ok(readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8").includes("a.researchOnly!==true"));
});

test("P0：未驗證提供子槽位不得自行解鎖，verifiedMount 布林不可繞過",async()=>{
 const {getAvailableSlots,reconcileSelection}=await import("../src/attachment-graph.mjs");
 const fx={id:"test",openSlots:["barrel"]};
 const fake=[
  {id:"barrel",slot:"barrel",compatibleWeapons:["test"],platformValidated:false,
   providesSlots:["rail",{slot:"optic",evidence:{type:"official-game",reference:"fake",checkedAt:"2026-10-24",platform:"mobile"}}]},
  {id:"rail",slot:"rail",compatibleWeapons:["test"],verifiedMount:true},
  {id:"optic",slot:"optic",compatibleWeapons:["test"],verifiedMount:true}
 ];
 const sel={barrel:"barrel",rail:"rail",optic:"optic"};
 assert.deepEqual([...getAvailableSlots(fx,fake,sel)],["barrel"]);
 const clean=reconcileSelection(fx,fake,sel);
 assert.deepEqual(clean.selected,{barrel:"barrel"});
 assert.deepEqual(new Set(clean.removed.map(x=>x.slot)),new Set(["rail","optic"]));
 const legitProof={type:"in-game-screenshot",reference:"TEST-EVIDENCE-FIXTURE",checkedAt:"2026-10-24",platform:"mobile"};
 fake[0].platformValidated=true;fake[0].mountValidation="verified";fake[0].fitmentEvidence=legitProof;
 fake[0].providesSlots=[{slot:"rail",evidence:legitProof}];
 fake[1].platformValidated=true;fake[1].mountValidation="verified";fake[1].fitmentEvidence=legitProof;
 fake[1].providesSlots=[{slot:"optic",evidence:legitProof}];
 assert.deepEqual([...getAvailableSlots(fx,fake,sel)].sort(),["barrel","optic","rail"]);
 assert.deepEqual(reconcileSelection(fx,fake,sel).removed,[]);
});
test("P0：引擎嚴格模式禁止任何未驗證配件，不可偽造父槽掛載",()=>{
 const a=attachments.find(x=>x.id==="akm-beaver-long-barrel");
 assert.throws(()=>resolveBuild(weapon,attachments,{barrel:a.id},{mode:"verified"}),/嚴格模式拒絕/);
 assert.throws(()=>resolveBuild(weapon,attachments,{barrel:a.id},{mode:"bad"}),/未知的配裝計算模式/);
 const child={id:"bad-child",slot:"charging",compatibleWeapons:["akm"],verifiedMount:true,effects:{handling:100}};
 assert.throws(()=>resolveBuild(weapon,[...attachments,child],{charging:child.id}),/未確認可直接掛載/);
});
test("P0：所有研究配件都有證據分類，沒有偽造的實機驗證",async()=>{
 const {auditAttachments,assessAttachment,isVerifiedEvidence}=await import("../src/data-governance.mjs");
 const audit=auditAttachments(weapon,attachments);
 assert.deepEqual(audit.issues,[]);
 assert.equal(audit.counts.total,45);
 assert.equal(audit.counts.verified,0);
 assert.equal(audit.counts.blocked,1);
 assert.equal(audit.counts.provisional,44);
 assert.equal(audit.counts.conflicts,2);
 assert.equal(audit.counts.providesVerifiedSlots,0);
 assert.equal(isVerifiedEvidence({type:"third-party-derived",reference:"https://foo",checkedAt:"2026-10-24",platform:"mobile"}),false);
 const pad=attachments.find(p=>p.researchOnly);
 assert.equal(assessAttachment(pad,weapon.id).eligible,false);
});
test("P0：數值衝突必須提供兩組情境邊界，並揭露試算公式",()=>{
 const item=attachments.find(x=>x.objectId===13020000357);
 const result=resolveBuild(weapon,attachments,{barrel:item.id});
 assert.equal(result.stats.recoilControl,47);
 assert.equal(result.scenarioBounds.recoilControl.min,45);
 assert.equal(result.scenarioBounds.recoilControl.max,47);
 assert.equal(result.scenarioBounds.muzzleVelocityMps.min,619.5);
 assert.equal(result.scenarioBounds.muzzleVelocityMps.max,682.5);
 assert.ok(result.assumptionDetails.length>=3);
});

test("P0 來源分級必須呈現於介面，衝突使用雙來源區間",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const app=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 for(const id of ["proof-verified","proof-provisional","proof-blocked","proof-conflicts","proof-summary","conflict-scenarios"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(app,/auditAttachments\(weapon,attachments\)/);
 assert.match(app,/result\.scenarioBounds/);
 assert.match(app,/p\.archiveComparison/);
});

test("P0 候選依附關係不會冒充有證據的正式子槽",()=>{
 const c=JSON.parse(readFileSync(new URL("../data/research/akm-fitment-candidates.json",import.meta.url)));
 assert.equal(c.target.platform,"mobile");
 assert.equal(c.rootSlots.verifiedParentEdges,0);
 assert.ok(c.candidates.length>=6);
 for(const row of c.candidates){
  assert.equal(row.verification,"candidate");
  assert.equal(row.mobileVerified,false);
  assert.ok(row.source.startsWith("https://"));
  assert.ok(["may-provide","may-block","paired-with","may-fit"].includes(row.relationship));
 }
});

test("P0：確認可裝不代表參數已核實；嚴格模式同時要求兩套證據",async()=>{
 const {assessAttachment,isVerifiedParameters,auditAttachments}=await import("../src/data-governance.mjs");
 const attachment=structuredClone(attachments.find(p=>p.id==="akm-beaver-long-barrel"));
 const proof={type:"in-game-screenshot",reference:"TEST-CASE-NO-PERSONAL-UID",checkedAt:"2026-10-24",platform:"mobile"};
 attachment.mountValidation="verified";attachment.platformValidated=true;attachment.fitmentEvidence=proof;
 assert.equal(assessAttachment(attachment,"akm").verified,false);
 assert.equal(isVerifiedParameters(attachment),false);
 attachment.parameterValidated=true;
 assert.equal(assessAttachment(attachment,"akm").verified,false);
 attachment.effectEvidence.status="verified";attachment.parameterEvidence=proof;
 assert.equal(assessAttachment(attachment,"akm").verified,true);
 const result=resolveBuild(weapon,[attachment],{barrel:attachment.id},{mode:"verified"});
 assert.equal(result.verified,true);
 const all=auditAttachments(weapon,attachments);
 assert.equal(all.counts.verified,0);
});
test("P0：實機嚴格模式接入手機 UI 與改槍台預覽",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const app=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 const gun=readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8");
 assert.match(html,/id="verified-only"/);
 assert.match(html,/id="mode-description"/);
 assert.match(app,/mode:buildMode/);
 assert.match(app,/option\.disabled=buildMode==="verified"/);
 assert.match(gun,/getMode\(\)==="research"/);
});

test("P1：實測後座資料與空白狀態不可偽造精準軌跡",async()=>{
 const {validateObservationSet,findMeasuredRecoil}=await import("../src/measurements.mjs");
 const d=JSON.parse(readFileSync(new URL("../data/research/akm-measurements.json",import.meta.url)));
 assert.deepEqual(validateObservationSet(d),d);
 assert.equal(findMeasuredRecoil(d,[]),null);
 assert.equal(findMeasuredRecoil(d,[1,2]),null);
 const invalid={...d,measurements:[{id:"bad",shotPoints:[{x:1,y:2,shot:1}]}]};
 assert.throws(()=>validateObservationSet(invalid));
 const viewer=readFileSync(new URL("../src/details.mjs",import.meta.url),"utf8");
 const app=readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 assert.match(viewer,/findMeasuredRecoil/);
 assert.match(viewer,/update\(stats,result\)/);
 assert.match(app,/details\.update\(stats,result\)/);
});

test("P1：本機雙網格 GLB 保持材質與線框檢查，且僅允許已分件彈匣聚焦",()=>{
 const viewer=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/model-reference.mjs",import.meta.url),"utf8");
 for(const fragment of ["setWireframe,resetCamera,focusPart","longestX=dims.x","renderer.setPixelRatio(Math.max(.5,ratio))"])
  assert.ok(viewer.includes(fragment),fragment);
 for(const fragment of ["instance.setWireframe","instance.resetCamera","不支援 3D 配件替換"])
  assert.ok(ui.includes(fragment),fragment);
});

test("P1 攝影機以兩軸取景，保持 AKM 3D 幾何比例而非沿軸壓縮",()=>{
 const source=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 assert.ok(source.includes("projectedWidth/(2*Math.tan(fov/2)*aspect*.80)"));
 assert.ok(source.includes("projectedHeight/(2*Math.tan(fov/2)*.73)"));
 assert.ok(source.includes("camera.position.copy(defaultView)"));
 assert.ok(!source.includes("asset.scale.set("));
});

test("P1：實際 GLB 檔頭、網格、材質與來源 SHA256 要全數一致",async()=>{
 const {verifyModelFiles,inspectGLB}=await import("../scripts/check-akm-model.mjs");
 const {provenance,asset}=verifyModelFiles();
 assert.equal(asset.meshCount,1);
 assert.ok(asset.materialCount>=1);
 assert.ok(asset.byteLength<2_000_000);
 assert.equal(provenance.separablePartsVerified,0);
 assert.ok(asset.imageCount>=1);
 assert.throws(()=>inspectGLB(Buffer.from("glTFhello")),/Invalid GLB/);
});

test("P1 雙網格 AKM 經視覺驗收後可作預設3D彈匣展示，仍保留獨立 QA 開關",()=>{
 const ui=readFileSync(new URL("../src/model-reference.mjs",import.meta.url),"utf8");
 const viewer=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 assert.ok(ui.includes('get("partReview")==="1"'));
 assert.ok(ui.includes("akm-parts-candidate.glb"));
 assert.ok(ui.includes("instance.setPartVisible"));
 assert.ok(viewer.includes("function setPartVisible(name,visible)"));
 assert.ok(ui.includes("並未確認遊戲裝配位置與動畫"));
});

test("P1 可控制真實 AKM 雙網格彈匣退出與復位，不更動遊戲裝備",()=>{
 const viewer=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/model-reference.mjs",import.meta.url),"utf8");
 assert.match(viewer,/async function animateMagazine\(\)/);
 assert.match(viewer,/mag\.position\.copy\(origin\)\.addScaledVector\(direction,progress\)/);
 assert.match(viewer,/mag\.position\.copy\(origin\)/);
 assert.match(viewer,/if\(magazineFrame\)documentWindow\.cancelAnimationFrame/);
 assert.match(ui,/3D 彈匣裝卸示範/);
 assert.match(ui,/const assetUrl="\.\/assets\/models\/akm-parts-candidate\.glb"/);
 assert.match(ui,/不代表已核實遊戲的裝配/);
});

test("P1：卸載 3D 視圖時會取消彈匣 RAF 並恢復幾何位置",()=>{
 const src=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 assert.match(src,/cancelMagazine=\(\)=>finish\(false\)/);
 assert.match(src,/cancelMagazine\?\.\(\)/);
 assert.match(src,/mag\.position\.copy\(origin\)/);
 assert.match(src,/magazineAnimating=false/);
});

test("P1 真正以 3D 網格位置記錄裝卸峰值位移與復位",()=>{
 const viewer=readFileSync(new URL("../src/local-viewer.mjs",import.meta.url),"utf8");
 const smoke=readFileSync(new URL("../scripts/p1-browser-check.mjs",import.meta.url),"utf8");
 assert.match(viewer,/mag\.position\.distanceTo\(origin\)/);
 assert.match(viewer,/canvas\.dataset\.magazineMaxDisplacement/);
 assert.match(viewer,/canvas\.dataset\.magazineDisplacement="0"/);
 assert.match(smoke,/magazinePeakDisplacement/);
 assert.match(smoke,/magazineFinalDisplacement/);
});
