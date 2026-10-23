/**
 * AKM prototype calculator. Deterministic, no IO or UI.
 * ONLY field-level additive assumptions; not a validated in-game simulator.
 */
export const SLOTS = Object.freeze(["barrel", "muzzle", "stock"]);
const FLAT_FIELDS = ["recoilControl","handling","aimStability","hipFireAccuracy"];
const PERCENT_FIELDS = ["effectiveRangePct","muzzleVelocityPct"];

export function resolveBuild(weapon, attachments, selected = {}) {
  if (!weapon || !weapon.base || !Array.isArray(attachments)) throw new TypeError("資料庫結構錯誤");
  const available = new Map(attachments.map(item => [item.id, item]));
  const output = { ...weapon.base };
  const equipped = [];
  const deltas = Object.fromEntries([...FLAT_FIELDS, ...PERCENT_FIELDS].map(key => [key, 0]));
  for (const [slot, id] of Object.entries(selected)) {
    if (!SLOTS.includes(slot)) throw new Error("未知槽位：" + slot);
    if (!id) continue;
    const item = available.get(id);
    if (!item || item.slot !== slot || !item.compatibleWeapons?.includes(weapon.id)) {
      throw new Error("不相容或不存在的配件：" + id);
    }
    equipped.push(item);
    for (const [key, amount] of Object.entries(item.effects)) {
      if (!(key in deltas) || !Number.isFinite(amount)) throw new Error("未知或無效的配件數值：" + key);
      deltas[key] += amount;
    }
  }
  for (const key of FLAT_FIELDS) output[key] += deltas[key];
  output.effectiveRangeM = round(weapon.base.effectiveRangeM * (1 + deltas.effectiveRangePct / 100), 2);
  output.muzzleVelocityMps = round(weapon.base.muzzleVelocityMps * (1 + deltas.muzzleVelocityPct / 100), 2);
  const pctCount = equipped.filter(item => (item.effects.effectiveRangePct || item.effects.muzzleVelocityPct)).length;
  return {
    stats: output, deltas, equipped,
    calculationStatus: pctCount > 1 ? "多個百分比效果採用假設的加總模型" : "面板修正的試算結果，尚未以手遊實機校準",
    compatibilityProvisional: equipped.some(item => item.confidence === "slot-inferred")
  };
}
export function idealFlightTimeMs(distanceM, velocityMps) {
  if (!Number.isFinite(distanceM) || distanceM < 0 || !Number.isFinite(velocityMps) || velocityMps <= 0) {
    throw new RangeError("距離或初速無效");
  }
  return round(distanceM / velocityMps * 1000, 2);
}
export function idealUnarmoredTtkMs(damage, rpm, health = 100) {
  if (![damage,rpm,health].every(Number.isFinite) || damage <= 0 || rpm <= 0 || health <= 0) throw new RangeError("TTK 參數無效");
  return round((Math.ceil(health / damage) - 1) * 60000 / rpm, 2);
}
function round(value, digits) { return Number(value.toFixed(digits)); }
