/**
 * Only measured recoil impacts can be drawn as a recoil trace.
 * Score values and artistic example dots are NEVER used as coordinates.
 */
export function validateObservationSet(bundle){
 if(!bundle||bundle.schemaVersion!==1||bundle.weaponId!=="akm"||bundle.platform!=="mobile"||bundle.gameMode!=="operations"||!Array.isArray(bundle.measurements))
  throw new TypeError("AKM 實測資料結構或平台錯誤");
 const ids=new Set();
 for(const m of bundle.measurements){
  if(typeof m.id!=="string"||ids.has(m.id)||!m.source?.startsWith("https://")||!m.gameVersion||m.weaponId!==bundle.weaponId||
    !Array.isArray(m.installedObjectIds)||!m.capturedAt||!m.cameraMode||!m.screenCoordinateCalibration||
    !Array.isArray(m.shotPoints)||m.shotPoints.length<2)throw new TypeError("不完整的後座力實測資料："+m.id);
  if(!m.shotPoints.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isSafeInteger(p.shot)&&p.shot>=1))
    throw new TypeError("後座力座標不合法："+m.id);
  ids.add(m.id);
 }
 return bundle;
}
export function findMeasuredRecoil(bundle,installedObjectIds){
 validateObservationSet(bundle);
 if(!Array.isArray(installedObjectIds))throw new TypeError("配件清單錯誤");
 const key=installedObjectIds.slice().sort().join(",");
 return bundle.measurements.find(m=>m.installedObjectIds.slice().sort().join(",")===key)||null;
}
