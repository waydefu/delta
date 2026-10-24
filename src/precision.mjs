/**
 * Exact-config precision evidence gate.
 * Main-panel research estimates NEVER imply a detailed multiplier or tuning
 * result. This module emits a value only for a matching current-mobile
 * observation with traceable per-profile evidence.
 */
export const PRECISION_MODES=Object.freeze(["default","tuned","compare"]);
export const parsePrecisionMode=value=>PRECISION_MODES.includes(value)?value:"default";
const idsOf=parts=>parts.map(p=>p.objectId).filter(Number.isSafeInteger).sort((a,b)=>a-b);
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const stamp=/^\\d{4}-\\d{2}-\\d{2}$/;

export function validatePrecisionCatalog(protocol,archive){
 if(!protocol?.context||!Array.isArray(protocol.rawDetailedMetricGroups)||
    !Array.isArray(protocol.tuningGuides)||!Array.isArray(archive?.observations))
   throw new TypeError("詳細屬性及精調紀錄資料不完整");
 const known=new Set();
 for(const group of protocol.rawDetailedMetricGroups){
  for(const fields of group.fields||[]){
   if(!Array.isArray(fields)||fields.length!==3||known.has(fields[0]))
     throw new TypeError("精調欄位重複或無效");
   known.add(fields[0]);
  }
 }
 const allowed=new Map(protocol.rawDetailedMetricGroups.flatMap(g=>g.fields.map(([id,,unit])=>[id,unit])));
 return {known,allowed};
}
function trusted(record,protocol,objectIds,calibrationMode,profileId,allowed){
 const scope=protocol.context;
 if(!record||!same(idsOf((record.objectIds||[]).map(objectId=>({objectId}))),objectIds))return false;
 const evidence=record.evidence||{};
 if(record.weaponId!==scope.weaponId||record.platform!==scope.platform||
    record.gameMode!==scope.gameMode||record.gameVersion!==scope.currentVersion||
    !record.gameVersion||record.gameVersion==="not-verified")return false;
 if(record.calibrationMode!==calibrationMode)return false;
 if(calibrationMode==="tuned"&&(!profileId||record.tuningProfileId!==profileId||
   !Array.isArray(record.tuningSettings)||!record.tuningSettings.length))return false;
 if(calibrationMode==="default"&&record.tuningProfileId)return false;
 if(evidence.type!=="in-game-screenshot"&&evidence.type!=="official-game")return false;
 if(typeof evidence.reference!=="string"||!evidence.reference.trim()||
    typeof evidence.checkedAt!=="string"||!stamp.test(evidence.checkedAt))return false;
 if(!record.metrics||typeof record.metrics!=="object"||!Object.keys(record.metrics).length)return false;
 return Object.entries(record.metrics).every(([id,value])=>allowed.has(id)&&Number.isFinite(value));
}
export function resolvePrecisionView(protocol,archive,equipped=[],mode="default",profileId=null){
 const {allowed}=validatePrecisionCatalog(protocol,archive);
 const selected=idsOf(equipped),targetMode=parsePrecisionMode(mode);
 const observations=archive.observations;
 const find=calibrationMode=>observations.find(entry=>
   trusted(entry,protocol,selected,calibrationMode,profileId,allowed));
 const defaultObservation=selected.length?find("default"):null;
 const tunedObservation=selected.length&&profileId?find("tuned"):null;
 const isBase=!selected.length;
 const guides=equipped.flatMap(part=>
  protocol.tuningGuides.filter(guide=>guide.slot===part.slot).map(guide=>({
   partName:part.name,slot:part.slot,dimensions:guide.dimensions,
   status:"slot-guidance-only; actual per-item eligibility unverified"
  })));
 const measured=(record,id)=>record&&Object.hasOwn(record.metrics,id)?record.metrics[id]:null;
 return {
  mode:targetMode,selectedCount:selected.length,baseOnly:isBase,guides,
  currentVersion:protocol.context.currentVersion,
  sources:[defaultObservation?.evidence,tunedObservation?.evidence].filter(Boolean),
  anyVerified:!!defaultObservation||!!tunedObservation,
  compareRow:(id,baseValue)=>{
   const unit=allowed.get(id);
   if(!unit)throw new TypeError("未知詳細屬性："+id);
   const format=value=>value===null?null:String(value)+unit;
   return {
    baseline:baseValue,
    default:isBase?baseValue:format(measured(defaultObservation,id)),
    tuned:format(measured(tunedObservation,id)),
    defaultStatus:isBase?"verified-baseline":defaultObservation&&measured(defaultObservation,id)!==null?"verified-observation":"unknown",
    tunedStatus:tunedObservation&&measured(tunedObservation,id)!==null?"verified-observation":"unknown"
   };
  }
 };
}
