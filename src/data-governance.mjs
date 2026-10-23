/**
 * DELTA LAB / P0 source and fitment authority boundary (2026-10-24)
 * Never infer a true attachment mount from an identical slot name, an item ID,
 * a third-party "compatible" list, or the existence of a build code.
 */
const PROOF_TYPES=new Set(["official-game","in-game-screenshot"]);
const MODIFIER_KEYS=new Set(["recoilControl","handling","aimStability","hipFireAccuracy","effectiveRangePct","muzzleVelocityPct","magazineCapacity"]);
export const RESEARCH_STATUS=Object.freeze({
 VERIFIED:"verified",CANDIDATE:"candidate",CONFLICT:"source-conflict",
 HISTORY:"historical-unverified",BLOCKED:"research-only"
});
export function isVerifiedEvidence(evidence){
 return Boolean(evidence && typeof evidence==="object" &&
  PROOF_TYPES.has(evidence.type) &&
  typeof evidence.reference==="string" && evidence.reference.trim().length>0 &&
  typeof evidence.checkedAt==="string" && /^\d{4}-\d{2}-\d{2}$/.test(evidence.checkedAt) &&
  typeof evidence.platform==="string" && evidence.platform.includes("mobile"));
}
export function isVerifiedFitment(part,weaponId){
 return Boolean(part && part.platformValidated===true && part.mountValidation==="verified" &&
  part.compatibleWeapons?.includes(weaponId) && isVerifiedEvidence(part.fitmentEvidence));
}
export function isVerifiedParameters(part){
 return Boolean(part && part.parameterValidated===true &&
  part.effectEvidence?.status==="verified" &&
  isVerifiedEvidence(part.parameterEvidence));
}
export function canProvideSlot(part,child,weaponId){
 if(!isVerifiedFitment(part,weaponId) || !child || typeof child!=="object")return false;
 const evidence=child.evidence;
 return typeof child.slot==="string" && child.slot.length>0 && isVerifiedEvidence(evidence);
}
export function assessAttachment(part,weaponId){
 if(!part)return {status:"unknown",eligible:false,verified:false,reason:"缺少配件"};
 if(part.researchOnly===true)return {status:"blocked",eligible:false,verified:false,reason:part.reviewNote||"掛載證據不足"};
 if(!part.compatibleWeapons?.includes(weaponId))return {status:"incompatible",eligible:false,verified:false,reason:"未列入此武器候選"};
 const verified=isVerifiedFitment(part,weaponId) && isVerifiedParameters(part);
 if(part.dataStatus==="source-conflict")return {status:"source-conflict",eligible:true,verified:false,reason:"跨來源數值衝突；僅可研究試算"};
 if(part.dataStatus==="historical-unverified")return {status:"historical",eligible:true,verified:false,reason:"2024 歷史快照，未核實 2026 手遊"};
 return {status:verified?"verified":"candidate",eligible:true,verified,reason:verified?"手遊證據已核實":"尚未取得現行手遊逐件相容性與參數證據"};
}
export function auditAttachments(weapon,attachments){
 if(!weapon?.id||!Array.isArray(attachments))throw new TypeError("無效的資料集");
 const issues=[],ids=new Set(),objectIds=new Set();
 const counts={total:0,verified:0,provisional:0,blocked:0,conflicts:0,historical:0,uncertainFitment:0,providesVerifiedSlots:0};
 for(const part of attachments){
  counts.total++;
  if(typeof part.id!=="string"||!part.id)issues.push("缺少 id");
  else if(ids.has(part.id))issues.push("重複配件 id："+part.id);
  ids.add(part.id);
  if(!Number.isSafeInteger(part.objectId))issues.push(part.id+" 缺少可信物品 ID");
  else if(objectIds.has(part.objectId))issues.push("重複 objectId："+part.objectId);
  objectIds.add(part.objectId);
  if(!Array.isArray(part.compatibleWeapons))issues.push(part.id+" 缺少候選武器列表");
  if(!part.source?.startsWith("https://")||!part.dataAsOf||!part.dataStatus)issues.push(part.id+" 缺少可追溯來源/日期/分類");
  if(!part.effects||typeof part.effects!=="object")issues.push(part.id+" 缺少配件修正欄位");
  else for(const [key,value] of Object.entries(part.effects)){
   if(!MODIFIER_KEYS.has(key)||!Number.isFinite(value))issues.push(part.id+" 無效效果："+key);
  }
  if(part.platformValidated===true && !isVerifiedFitment(part,weapon.id))issues.push(part.id+" 宣稱掛載已實機驗證卻缺少可核對的證據");
  if(part.parameterValidated===true && !isVerifiedParameters(part))issues.push(part.id+" 宣稱數值已驗證卻缺少同版遊戲數值證據");
  if(part.providesSlots?.some(child=>!canProvideSlot(part,child,weapon.id)))issues.push(part.id+" 有未核實的子槽宣告");
  if(part.providesSlots)counts.providesVerifiedSlots+=part.providesSlots.filter(child=>canProvideSlot(part,child,weapon.id)).length;
  const assessment=assessAttachment(part,weapon.id);
  if(assessment.verified)counts.verified++;
  else if(!assessment.eligible)counts.blocked++;
  else counts.provisional++;
  if(part.dataStatus==="source-conflict")counts.conflicts++;
  if(part.dataStatus==="historical-unverified")counts.historical++;
  if(!assessment.verified)counts.uncertainFitment++;
 }
 return {counts,issues,complete:issues.length===0&&counts.verified===counts.total,
  verification:"Current mobile in-game evidence is required per item, not just publicly scraped slots."};
}
