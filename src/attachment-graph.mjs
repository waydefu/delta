/**
 * Mount dependency graph: root slots are observations/candidates. New child
 * slots require *verified in-game* evidence on each provider edge.
 * Fail closed: a string like providesSlots:["rail"] can NEVER unlock a slot.
 */
import {canProvideSlot,assessAttachment} from "./data-governance.mjs";
function allItems(attachments){return new Map(attachments.map(p=>[p.id,p]));}
export function getAvailableSlots(weapon,attachments,selected={}){
 if(!weapon||!Array.isArray(attachments)||!selected||typeof selected!=="object")
  throw new TypeError("掛載資料無效");
 const known=allItems(attachments),slots=new Set(weapon.openSlots||[]);
 for(let i=0;i<=attachments.length;i++){
  let grew=false;
  for(const [slot,id] of Object.entries(selected)){
   if(!id||!slots.has(slot))continue;
   const part=known.get(id);
   if(!part||part.slot!==slot||!assessAttachment(part,weapon.id).eligible)continue;
   for(const child of part.providesSlots||[]){
    if(!canProvideSlot(part,child,weapon.id))continue;
    if(!slots.has(child.slot)){slots.add(child.slot);grew=true;}
   }
  }
  if(!grew)break;
 }
 return slots;
}
export function reconcileSelection(weapon,attachments,proposed={},options={}){
 const mode=options.mode||"research";
 if(!["research","verified"].includes(mode))throw new TypeError("未知的配件驗證模式");
 const known=allItems(attachments),selection={...proposed},removed=[];
 for(let i=0;i<=Object.keys(selection).length+1;i++){
  const available=getAvailableSlots(weapon,attachments,selection);
  let changed=false;
  for(const [slot,id] of Object.entries(selection)){
   if(!id)continue;
   const part=known.get(id),check=assessAttachment(part,weapon.id);
   const valid=available.has(slot)&&part?.slot===slot&&check.eligible&&(mode==="research"||check.verified);
   if(!valid){
    removed.push({slot,id,reason:!available.has(slot)?"mount-unavailable":!check.eligible?"research-blocked":mode==="verified"&&!check.verified?"unverified":"invalid-attachment"});
    delete selection[slot];changed=true;
   }
  }
  if(!changed)break;
 }
 return {selected:selection,removed,openSlots:getAvailableSlots(weapon,attachments,selection)};
}
