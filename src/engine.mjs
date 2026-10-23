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

export function resolveBuild(weapon,attachments,selected={}){
  if(!weapon?.base||!Array.isArray(attachments)||selected===null||typeof selected!=="object")
    throw new TypeError("資料庫結構錯誤");
  const known=new Map(attachments.map(a=>[a.id,a]));
  const equipped=[],out={...weapon.base};
  const deltas=Object.fromEntries([...FLAT_FIELDS,...PERCENT_FIELDS].map(k=>[k,0]));
  const overrides={};
  const sourceWarnings=[];
  for(const [slot,id] of Object.entries(selected)){
    if(!SLOTS.includes(slot))throw new Error("未知槽位："+slot);
    if(!id)continue;
    const item=known.get(id);
    if(!item||item.slot!==slot||!item.compatibleWeapons?.includes(weapon.id))
      throw new Error("不相容或不存在的配件："+id);
    if(!weapon.openSlots?.includes(slot) && !(item.verifiedMount===true))
      throw new Error("此配件槽未確認可直接掛載："+slot);
    const effects=item.effects||{};
    for(const [key,amount] of Object.entries(effects)){
      if(!ALLOWED_EFFECTS.has(key)||!Number.isFinite(amount))
        throw new Error("未知或無效的配件數值："+key);
      if(OVERRIDE_FIELDS.includes(key)){
        if(!Number.isSafeInteger(amount)||amount<1)throw new Error("容量無效："+amount);
        overrides[key]=amount;
      }else deltas[key]+=amount;
    }
    if(item.dataStatus==="source-conflict")sourceWarnings.push(item.name+" 存在來源數值衝突，未經手遊核實");
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
  return {
    stats:out,deltas,overrides,equipped,sourceWarnings,
    calculationStatus:pctCount>1?"多個百分比效果採用假設的加總模型":"面板修正的試算結果，尚未以手遊實機校準",
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
