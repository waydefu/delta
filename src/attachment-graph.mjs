/**
 * Data-driven attachment mount resolver. The current AKM dataset has three
 * researched root slots; no child slot is treated as verified until an
 * attachment provides it in data. Supports future barrel -> rail -> sight chains.
 */
function allItems(attachments) {
  return new Map(attachments.map(part => [part.id,part]));
}
export function getAvailableSlots(weapon, attachments, selected = {}) {
  if(!weapon || !Array.isArray(attachments) || !selected || typeof selected!=="object") {
    throw new TypeError("掛載資料無效");
  }
  const known=allItems(attachments);
  const slots=new Set(weapon.openSlots||[]);
  // At most N provider passes, plus one for root. Cycles cannot make progress forever.
  for(let iteration=0;iteration<=attachments.length;iteration++){
    let grew=false;
    for(const [slot,id] of Object.entries(selected)){
      if(!id || !slots.has(slot))continue;
      const part=known.get(id);
      if(!part || part.researchOnly===true || part.slot!==slot || !part.compatibleWeapons?.includes(weapon.id))continue;
      for(const child of part.providesSlots||[]){
        const name=typeof child==="string"?child:child?.slot;
        if(typeof name!=="string"||!name)throw new Error("子槽位格式不正確");
        if(!slots.has(name)){slots.add(name);grew=true;}
      }
    }
    if(!grew)break;
  }
  return slots;
}
export function reconcileSelection(weapon, attachments, proposed={}) {
  const known=allItems(attachments);
  const selection={...proposed};
  const removed=[];
  // A changed barrel invalidates child slots, then grandchildren, etc.
  for(let iteration=0;iteration<=Object.keys(selection).length+1;iteration++){
    const open=getAvailableSlots(weapon,attachments,selection);
    let changed=false;
    for(const [slot,id] of Object.entries(selection)){
      if(!id)continue;
      const part=known.get(id);
      const valid=open.has(slot) &&
        part?.researchOnly!==true &&
        part?.slot===slot &&
        part?.compatibleWeapons?.includes(weapon.id);
      if(!valid){
        removed.push({slot,id,reason:open.has(slot)?"invalid-attachment":"mount-unavailable"});
        delete selection[slot];changed=true;
      }
    }
    if(!changed)break;
  }
  return {selected:selection,removed,openSlots:getAvailableSlots(weapon,attachments,selection)};
}
