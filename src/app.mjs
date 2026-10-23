import { initResearchCatalog } from "./research-catalog.mjs";
import { setupMotionToggle, initializeEntrance, countTo, drawLine, diagramEnter } from "./motion.mjs";
import { reconcileSelection } from "./attachment-graph.mjs";
import { initGunsmith } from "./gunsmith.mjs";
import { renderMountGraph, renderContributions, renderFlightChart } from "./visualizations.mjs";
import { initDetails } from "./details.mjs";
import { resolveBuild, idealFlightTimeMs, idealUnarmoredTtkMs, SLOTS } from "./engine.mjs";
const $ = id => document.getElementById(id);
const slotNames = {muzzle:"槍口",barrel:"槍管",optic:"瞄具",canted:"側瞄",foregrip:"前握把",magazine:"彈匣",magwell:"彈匣座",stock:"槍托",buttpad:"槍托墊",reargrip:"後握把",charging:"拉機柄"};
const statFields = [
  ["recoilControl","後座力控制","點"],
  ["handling","操控速度","點"],
  ["aimStability","據槍穩定性","點"],
  ["hipFireAccuracy","腰射精度","點"],
  ["effectiveRangeM","有效射程","m"],
  ["muzzleVelocityMps","槍口初速","m/s"]
];
const query = new URLSearchParams(location.search);
const selections = Object.fromEntries(SLOTS.map(slot => [slot, query.get(slot) || ""]));
let distance = Math.min(200, Math.max(10, Number(query.get("distance")) || 80));
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text !== undefined) node.textContent = String(text);
  return node;
};
function format(number) { return Number(number).toLocaleString("zh-TW", { maximumFractionDigits: 2 }); }
function describeDelta(value, unit = "") {
  return value === 0 ? "—" : (value > 0 ? "+" : "−") + format(Math.abs(value)) + unit;
}
function setText(id, value) { $(id).textContent = value; }
async function main() {
  try {
    setupMotionToggle($("motion-toggle"));
    const [wr, ar] = await Promise.all([fetch("./data/weapons/akm.json"),fetch("./data/attachments/akm-sample.json")]);
    if(!wr.ok || !ar.ok) throw new Error("資料載入失敗（需透過 HTTP 伺服器開啟）");
    const weapon = await wr.json();
    const attachments = await ar.json();
    initResearchCatalog($("research-directory"),attachments);
    setText("weapon-subtitle", weapon.caliber + " · 600 RPM · 30 發");
    setText("snapshot", "裸槍實機值已核對 · 部分配件僅有 2024 歷史值，均未經 2026 手遊核對");
    setText("ammo-text", weapon.ammo.join(" · "));
    const sourceWrap = $("sources");
    for(const url of weapon.sourceUrls) {
      const a = el("a", "source-link", new URL(url).hostname);
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      sourceWrap.append(a);
    }
    const controlWrap = $("controls");
    for(const slot of SLOTS) {
      const panel = el("div", "slot-panel");
      const label = el("label", "slot-label", slotNames[slot]);
      label.htmlFor = "select-" + slot;
      const select = el("select", "slot-select");
      select.id = "select-" + slot;
      select.append(new Option("未安裝（裸槍基準）", ""));
      for(const part of attachments.filter(a => a.slot === slot && a.researchOnly!==true)) {
        select.append(new Option(part.name + (part.dataStatus==="source-conflict"?" · ⚠ 來源衝突":part.dataStatus==="historical-unverified"?" · 2024 歷史": " · 待核驗"), part.id));
      }
      select.value = attachments.some(a=>a.id===selections[slot] && a.slot===slot && a.researchOnly!==true) ? selections[slot] : "";
      selections[slot] = select.value;
      select.addEventListener("change", () => { const normalized=reconcileSelection(weapon,attachments,{...selections,[slot]:select.value});Object.assign(selections,normalized.selected);for(const key of SLOTS){selections[key]=normalized.selected[key]||"";$("select-"+key).value=selections[key];}update(); });
      panel.append(label, select);
      controlWrap.append(panel);
    }
    const bench = initGunsmith($("gunsmith-workbench"), selections, attachments, (slot, id) => {
      const proposed={...selections,[slot]:id};
      const result=reconcileSelection(weapon,attachments,proposed);
      for(const key of Object.keys(selections))delete selections[key];
      Object.assign(selections,result.selected);
      for(const key of SLOTS) $("select-" + key).value = selections[key]||"";
      update();
    },weapon);
    await initDetails($("detail-explorer"));
    $("distance").value = distance;
    $("distance").addEventListener("input", event => { distance = Number(event.target.value); update(false); });
    $("reset").addEventListener("click", () => {
      for(const slot of SLOTS) { selections[slot] = ""; $("select-" + slot).value = ""; }
      distance = 80; $("distance").value = 80; update();
    });
    $("copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href); setText("copy", "已複製 ✓"); setTimeout(()=>setText("copy","分享配置"),1600); }
      catch { setText("copy","複製失敗，請使用網址列"); }
    });
    function update(buildChanged = true) {
      const result = resolveBuild(weapon,attachments,selections);
      if(!buildChanged){
        setText("distance-label",distance+" m");
        setText("flight-time",format(idealFlightTimeMs(distance,result.stats.muzzleVelocityMps))+" ms");
        setText("flight-distance",distance+" m");
        const params=new URLSearchParams(location.search);params.set("distance",String(distance));
        history.replaceState(null,"",location.pathname+"?"+params);
        return;
      }
      bench.refresh();
      renderMountGraph($("mount-graph"), result.equipped.find(x=>x.slot==="barrel"));
      diagramEnter($("mount-graph"));
      renderContributions($("contribution-viz"),weapon,result);
      renderFlightChart($("flight-chart"),weapon.base.muzzleVelocityMps,result.stats.muzzleVelocityMps);
      for(const path of $("flight-chart").querySelectorAll("polyline:not([stroke-dasharray])"))drawLine(path);
      const stats = result.stats;
      setText("distance-label", distance + " m");
      setText("flight-time", format(idealFlightTimeMs(distance,stats.muzzleVelocityMps)) + " ms");
      setText("flight-velocity", format(stats.muzzleVelocityMps) + " m/s");
      setText("flight-distance", distance + " m");
      setText("ttk", format(idealUnarmoredTtkMs(stats.fleshDamage,stats.fireRateRpm)) + " ms");
      const statWrap = $("stat-list"); statWrap.replaceChildren();
      for(const [field,title,unit] of statFields) {
        const row = el("div","stat-row");
        const head = el("div","stat-head");
        const label = el("span","stat-label",title);
        const values = el("span","stat-values");
        const current = el("strong","stat-current",format(stats[field]) + " " + unit);
        const base = weapon.base[field];
        const delta = stats[field] - base;
        if(Math.abs(delta) > 0.001) {
          const deltaNode=el("span",delta>0 ? "stat-positive" : "stat-negative",describeDelta(delta,unit));
          values.append(deltaNode);
        }
        values.append(current);
        head.append(label,values);
        const track=el("div","stat-track"), bar=el("div","stat-bar");
        const scale=field==="effectiveRangeM" ? 100 : field==="muzzleVelocityMps" ? 1000 : 100;
        bar.style.width=Math.max(0,Math.min(100,stats[field]/scale*100))+"%";
        track.append(bar); row.append(head,track); statWrap.append(row);
      }
      countTo($("handling-summary"),format(stats.handling));
      countTo($("recoil-summary"),format(stats.recoilControl));
      setText("range-summary",format(stats.effectiveRangeM) + " m");
      setText("velocity-summary",format(stats.muzzleVelocityMps) + " m/s");
      setText("equipped-count",result.equipped.length + " 件研究配件");
      setText("magazine-capacity-current",stats.magazineCapacity+" 發");
      const breakdown=$("breakdown"); breakdown.replaceChildren();
      if(!result.equipped.length) breakdown.append(el("li","breakdown-empty","尚未安裝配件，顯示裸槍基準。"));
      for(const part of result.equipped) {
        const item=el("li","breakdown-item");
        const top=el("div","breakdown-top");
        top.append(el("span","breakdown-name",part.name),el("span","breakdown-slot",slotNames[part.slot]));
        const info=el("small","breakdown-effects",Object.entries(part.effects).map(([key,val])=>{
          const map={recoilControl:"後座",handling:"操控",aimStability:"穩定",hipFireAccuracy:"腰射",effectiveRangePct:"射程",muzzleVelocityPct:"初速",magazineCapacity:"容量"};
          return map[key]+" "+(key==="magazineCapacity"?val+" 發":describeDelta(val,key.endsWith("Pct")?"%":""));
        }).join("  ·  "));
        item.append(top,info);
        if(part.platformValidated!==true) item.append(el("small","provisional",part.dataStatus==="source-conflict"?"⚠ 來源衝突，尚未核實":part.dataStatus==="historical-unverified"?"⚠ 2024 歷史資料；遊戲版本與數值待核驗":"⚠ 社群配件數值／相容性尚未由 2026 手遊核驗"));
        breakdown.append(item);
      }
      setText("model-note",result.calculationStatus + "。實際彈道下墜與連射後座力仍待實測。" +
        (result.compatibilityProvisional?" 所有已選配件均未獲得手遊完整實機驗證。":"")+
        (result.sourceWarnings.some(s=>s.includes("2024"))?" ⚠ 包含 2024 歷史數值，不能當作現行版本。":"")+
        (result.sourceWarnings.some(s=>s.includes("衝突"))?" ⚠ 有數值來源衝突，待實機確認。":""));
      const params = new URLSearchParams();
      for(const slot of SLOTS) if(selections[slot]) params.set(slot,selections[slot]);
      params.set("distance",String(distance));
      history.replaceState(null,"",location.pathname + "?" + params);
    }
    update();
    initializeEntrance();
  } catch (error) {
    console.error(error); setText("error",error.message); $("error").hidden = false;
  }
}
main();
