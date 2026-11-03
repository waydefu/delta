/**
 * The 0–100 score axis is an index of observed scores, NOT a physical formula.
 * Do not fill missing scores, interpolate, or merge mobile/Operations and
 * historical Warfare observations.
 */
export const SCORE_FIELDS = Object.freeze({
  damage: "fleshDamage",
  recoil: "recoilControl",
  handling: "handling",
  stability: "aimStability",
  hipfire: "hipFireAccuracy"
});
const LOWER_IS_BETTER = new Set([
  "autoVerticalRecoilMultiplier", "autoHorizontalRecoilMultiplier",
  "burstVerticalRecoilMultiplier", "burstHorizontalRecoilMultiplier",
  "weaponFiringStability", "adsTime", "sprintToFire",
  "reloadTime", "emptyReloadTime", "holsterTime", "swapTime",
  "breathingSwayRange", "breathHoldRecoilMultiplier", "flinchMultiplier",
  "standingSpread", "maxStandingSpread"
]);
const HIGHER_IS_BETTER = new Set([
  "adsMoveSpeed", "walkSpeed", "sprintSpeed", "breathHoldSeconds",
  "damage0", "damage1", "damage2", "damage3", "damage4"
]);

export function parseDetailNumber(value) {
  if(typeof value !== "string") return null;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
  if(!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) ? {value:number,unit:match[2].trim()} : null;
}

export function benefitPercent(baseline,current,direction) {
  if(!Number.isFinite(baseline)||!Number.isFinite(current)) return null;
  if(baseline===current)return 0;
  if(baseline<=0) return null;
  if(direction==="lower") return (baseline-current)/baseline*100;
  if(direction==="higher") return (current-baseline)/baseline*100;
  return null; // Direction not established; unchanged values are not assumed to be a benefit.
}

export function getYieldGroups(details,protocol) {
  if(!Array.isArray(details?.groups)||!details?.base||!Array.isArray(protocol?.rawDetailedMetricGroups))
    throw new TypeError("Detailed game data is missing");
  return details.groups.map(group=>{
    const scoreField=SCORE_FIELDS[group.id];
    if(!scoreField) throw new TypeError("Unknown score group: "+group.id);
    const baseScore=details.base[scoreField];
    if(!Number.isInteger(baseScore)||baseScore<0||baseScore>100)
      throw new TypeError("Baseline score must be within 0–100");
    const definitions=protocol.rawDetailedMetricGroups.find(g=>g.id===group.id)?.fields||[];
    const metrics=group.values.map(([label,raw],index)=>{
      const key=definitions.find(([,name])=>name===label)?.[0]|| (group.id==="damage"?"damage"+index:null);
      if(!key) throw new TypeError("Unmapped detailed metric: "+label);
      const parsed=parseDetailNumber(raw);
      if(!parsed) throw new TypeError("Non-numeric baseline metric: "+label);
      const direction=LOWER_IS_BETTER.has(key)?"lower":HIGHER_IS_BETTER.has(key)?"higher":null;
      return {key,label,baseValue:parsed.value,unit:parsed.unit,direction};
    });
    return {id:group.id,label:group.label,scoreField,baseScore,metrics};
  });
}

export function getYieldRows(group,metricKey,archive=null) {
  const metric=group.metrics.find(m=>m.key===metricKey);
  if(!metric) throw new TypeError("Unknown detailed metric: "+metricKey);
  const observed=new Map();
  const origin=archive ? "歷史社群紀錄" : "2026 手遊裸槍截圖";
  if(archive) {
    if(archive.group!==group.id||!Array.isArray(archive.samples))throw new TypeError("Archive group mismatch");
    for(const row of archive.samples) {
      if(!Number.isInteger(row.score)||row.score<0||row.score>100)
        throw new TypeError("Out-of-range observed score");
      const value=row.metrics?.[metricKey];
      if(value===undefined||value===null)continue;
      if(!Number.isFinite(value)||value<0||observed.has(row.score))
        throw new TypeError("Invalid or duplicated observed metric");
      observed.set(row.score,value);
    }
  } else observed.set(group.baseScore,metric.baseValue);
  const baseline=observed.get(group.baseScore);
  return Array.from({length:101},(_,score)=>{
    const value=observed.get(score);
    const hasValue=value!==undefined;
    return {
      score,value:hasValue?value:null,
      benefit:hasValue?benefitPercent(baseline,value,metric.direction):null,
      status:hasValue?origin:"沒有相同模式／條件的實測數值"
    };
  });
}

export function isCurrentDetailKnown(currentScore,group,equippedCount,archive=null) {
  // The same headline score does not prove the same underlying parameters.
  return !archive && equippedCount===0 && currentScore===group.baseScore;
}
