import {getAvailableSlots} from "./attachment-graph.mjs";
import {assessAttachment} from "./data-governance.mjs";
/**
 * Research-only AKM stat estimator. Tested arithmetic != real game formula.
 * Per-slot equip and source age are surfaced, not silently hidden.
 */
export const SLOTS=Object.freeze([
  "muzzle","barrel","optic","canted","foregrip","magazine","magwell","stock","buttpad","reargrip","charging"
]);
export const FLAT_FIELDS=Object.freeze(["recoilControl","handling","aimStability","hipFireAccuracy"]);
export const PERCENT_FIELDS=Object.freeze(["effectiveRangePct","muzzleVelocityPct"]);
export const OVERRIDE_FIELDS=Object.freeze(["magazineCapacity"]);
const ALLOWED_EFFECTS=new Set([...FLAT_FIELDS,...PERCENT_FIELDS,...OVERRIDE_FIELDS]);
const round=(n,digits=2)=>Number(n.toFixed(digits));

export function resolveBuild(weapon,attachments,selected={},options={}){
  const mode=options.mode||"research";
  if(!["research","verified"].includes(mode))throw new TypeError("未知的配裝計算模式");
  if(!weapon?.base||!Array.isArray(attachments)||selected===null||typeof selected!=="object")
    throw new TypeError("資料庫結構錯誤");
  const known=new Map(attachments.map(a=>[a.id,a]));
  const availableSlots=getAvailableSlots(weapon,attachments,selected);
  const equipped=[],out={...weapon.base};
  const deltas=Object.fromEntries([...FLAT_FIELDS,...PERCENT_FIELDS].map(k=>[k,0]));
  const overrides={};
  const sourceWarnings=[];
  const selectedConflictParts=[];
  for(const [slot,id] of Object.entries(selected)){
    if(!SLOTS.includes(slot))throw new Error("未知槽位："+slot);
    if(!id)continue;
    const item=known.get(id);
    if(!item||item.slot!==slot||!item.compatibleWeapons?.includes(weapon.id))
      throw new Error("不相容或不存在的配件："+id);
    const assessment=assessAttachment(item,weapon.id);
    if(item.researchOnly===true)throw new Error("配件僅供研究，尚未確認可裝配："+id);
    if(!availableSlots.has(slot))throw new Error("此配件槽未確認可直接掛載："+slot);
    if(!assessment.eligible)throw new Error("配件缺少相容性證據："+id);
    if(mode==="verified"&&!assessment.verified)throw new Error("嚴格模式拒絕未實機驗證的配件："+id);
    const effects=item.effects||{};
    for(const [key,amount] of Object.entries(effects)){
      if(!ALLOWED_EFFECTS.has(key)||!Number.isFinite(amount))
        throw new Error("未知或無效的配件數值："+key);
      if(OVERRIDE_FIELDS.includes(key)){
        if(!Number.isSafeInteger(amount)||amount<1)throw new Error("容量無效："+amount);
        overrides[key]=amount;
      }else deltas[key]+=amount;
    }
    if(item.dataStatus==="source-conflict"){
      sourceWarnings.push(item.name+" 存在來源數值衝突，未經手遊核實");
      selectedConflictParts.push(item);
    }
    if(item.dataStatus==="historical-unverified")
      sourceWarnings.push(item.name+" 為 2024 年歷史快照，未確認 2026 手遊數值");
    else if(item.platformValidated!==true)sourceWarnings.push(item.name+" 尚未經手遊核驗");
    equipped.push(item);
  }
  for(const key of FLAT_FIELDS)out[key]=round(weapon.base[key]+deltas[key]);
  out.effectiveRangeM=round(weapon.base.effectiveRangeM*(1+deltas.effectiveRangePct/100));
  out.muzzleVelocityMps=round(weapon.base.muzzleVelocityMps*(1+deltas.muzzleVelocityPct/100));
  for(const [key,value] of Object.entries(overrides))out[key]=value;
  const pctCount=equipped.filter(a=>a.effects?.effectiveRangePct||a.effects?.muzzleVelocityPct).length;
  // Calculate alternate documented-source scenarios. Bounds are source scenarios,
  // NOT confidence intervals or real-world ballistics.
  const scenarioBounds=Object.fromEntries(
    ["recoilControl","handling","aimStability","hipFireAccuracy","effectiveRangeM","muzzleVelocityMps"]
    .map(key=>[key,{min:out[key],max:out[key]}]));
  for(const item of selectedConflictParts){
    const alt=item.archiveComparison?.effects;
    if(!alt)continue;
    for(const key of FLAT_FIELDS){
      const delta=(alt[key]??item.effects[key]??0)-(item.effects[key]??0);
      if(delta){
        scenarioBounds[key].min+=Math.min(0,delta);
        scenarioBounds[key].max+=Math.max(0,delta);
      }
    }
    for(const [effectKey,statKey,baseKey] of [
      ["effectiveRangePct","effectiveRangeM","effectiveRangeM"],
      ["muzzleVelocityPct","muzzleVelocityMps","muzzleVelocityMps"]
    ]){
      const delta=(alt[effectKey]??item.effects[effectKey]??0)-(item.effects[effectKey]??0);
      const effect=round(weapon.base[baseKey]*delta/100);
      scenarioBounds[statKey].min+=Math.min(0,effect);
      scenarioBounds[statKey].max+=Math.max(0,effect);
    }
  }
  for(const bounds of Object.values(scenarioBounds)){
    bounds.min=round(bounds.min);bounds.max=round(bounds.max);
  }
  return {
    stats:out,deltas,overrides,equipped,sourceWarnings,scenarioBounds,
    modelMode:mode,verified:equipped.every(p=>assessAttachment(p,weapon.id).verified),
    assumptionDetails:[
      "固定面板點數按加總估算，未證實遊戲加成公式",
      "射程／初速百分比按裸槍基準加總，未證實堆疊與取整規則",
      "有來源衝突時 stats 採研究樣本值，scenarioBounds 同時展示舊來源的區間",
      "彈匣容量採單件覆寫，無法由面板點數反推精確換彈時間"
    ],
    calculationStatus:pctCount>1?"多個百分比效果採用假設的加總模型":"面板修正的研究試算；未實機校準公式",
    compatibilityProvisional:equipped.some(a=>a.confidence!=="verified"||a.platformValidated!==true)
  };
}
export function idealFlightTimeMs(distanceM,velocityMps){
 if(!Number.isFinite(distanceM)||distanceM<0||!Number.isFinite(velocityMps)||velocityMps<=0)
   throw new RangeError("距離或初速無效");
 return round(distanceM/velocityMps*1000);
}
export function idealUnarmoredTtkMs(damage,rpm,health=100){
 if(![damage,rpm,health].every(Number.isFinite)||damage<=0||rpm<=0||health<=0)
   throw new RangeError("TTK 參數無效");
 return round((Math.ceil(health/damage)-1)*60000/rpm);
}
