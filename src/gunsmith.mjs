import { attachStudioLight } from "./studio-light.mjs";
import { sheetEntrance, sheetExit, notifySlot, swapContents, shouldAnimate } from "./motion.mjs";
import { getAvailableSlots } from "./attachment-graph.mjs";
import { resolveBuild } from "./engine.mjs";
const SLOTS=[
 ["muzzle","槍口",9,32,8,49],
 ["barrel","槍管",24,12,30,49],
 ["charging","拉機柄",43,6,49,44],
 ["optic","瞄準鏡",65,8,61,43],
 ["canted","側瞄準器",80,16,66,46],
 ["buttpad","槍托墊",92,34,93,56],
 ["stock","槍托",92,72,82,60],
 ["reargrip","後握把",77,86,61,69],
 ["magazine","彈匣",43,88,46,70],
 ["magwell","彈匣座",62,91,52,62],
 ["foregrip","前握把",17,78,28,59]
];
const ENABLED=new Set(["muzzle","barrel","stock"]);

const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
export function initGunsmith(mount,selections,attachments,onPick,weapon){
 const resolveBuildPreview=value=>resolveBuild(weapon,attachments,value);
 const stage=node("div","bench-canvas");
 const grid=node("div","bench-grid");
 const img=node("img","bench-gun");img.src="./assets/akm-side.svg";img.alt="AKM 側面示意（彈匣已獨立分件）";img.draggable=false;
 const magazine=node("img","bench-magazine");magazine.src="./assets/akm-magazine.svg";magazine.alt="";magazine.draggable=false;magazine.setAttribute("aria-hidden","true");
 const lines=document.createElementNS("http://www.w3.org/2000/svg","svg");
 lines.classList.add("bench-lines");lines.setAttribute("viewBox","0 0 1000 560");lines.setAttribute("preserveAspectRatio","none");
 const buttons=new Map();
 stage.append(grid,img,magazine,lines);
 for(const [id,label,x,y,tx,ty] of SLOTS){
  const line=document.createElementNS("http://www.w3.org/2000/svg","line");
  for(const [key,value] of [["x1",x*10],["y1",y*5.6],["x2",tx*10],["y2",ty*5.6]])line.setAttribute(key,String(value));
  lines.append(line);
  const button=node("button","bench-slot");button.type="button";button.style.left=x+"%";button.style.top=y+"%";
  button.setAttribute("aria-label",label+"配件槽");const title=node("span","bench-slot-name",label);
  const icon=node("span","bench-slot-icon",["muzzle","barrel","stock"].includes(id)?"＋":"◇");icon.setAttribute("aria-hidden","true");
  const status=node("span","bench-slot-state");button.append(title,icon,status);
  button.addEventListener("click",()=>open(id));stage.append(button);buttons.set(id,{button,status});
 }
 const overlay=node("div","bench-overlay");
 overlay.append(node("span","bench-model-kind","AKM SIDE PROFILE / CALIBRATED"),node("span","bench-model-measure","880 mm PHYSICAL REFERENCE"));
 stage.append(overlay,node("span","bench-watermark","AKM / CALIBRATED PROFILE"));
 const shade=node("button","bench-shade");shade.type="button";shade.hidden=true;shade.setAttribute("aria-label","關閉配件選單");
 const drawer=node("aside","bench-drawer");drawer.hidden=true;drawer.setAttribute("aria-label","配件選單");
 mount.append(stage,shade,drawer);
 const studio=attachStudioLight(stage);
 for(const [id,label,x,y,tx,ty] of SLOTS){
  const b=buttons.get(id)?.button;
  b?.addEventListener("pointerenter",()=>studio.cueAt(tx/100,ty/100));
  b?.addEventListener("focus",()=>studio.cueAt(tx/100,ty/100));
 }
 let active=null;
 let closing=false,opener=null;
 function inspectMagazine(){
   if(typeof magazine.animate!=="function"||!shouldAnimate()){
     magazine.classList.add("magazine-inspected");
     magazine.addEventListener("transitionend",()=>magazine.classList.remove("magazine-inspected"),{once:true});
     requestAnimationFrame(()=>magazine.classList.remove("magazine-inspected"));
     return;
   }
   magazine.getAnimations().forEach(a=>a.cancel());
   magazine.animate([
     {transform:"translate3d(0,0,0) rotate(0deg)",opacity:1,offset:0},
     {transform:"translate3d(-18px,34px,0) rotate(-7deg)",opacity:1,offset:.42},
     {transform:"translate3d(-18px,34px,0) rotate(-7deg)",opacity:1,offset:.58},
     {transform:"translate3d(0,0,0) rotate(0deg)",opacity:1,offset:1}
   ],{duration:820,easing:"cubic-bezier(.22,.75,.28,1)"});
 }
 const close=async()=>{if(active===null||closing)return;closing=true;await sheetExit(drawer);active=null;shade.hidden=true;drawer.hidden=true;closing=false;refresh();opener?.focus({preventScroll:true});};
 shade.addEventListener("click",close);
 document.addEventListener("keydown",event=>{
   if(active!==null && event.key==="Escape"){event.preventDefault();close();}
   if(active!==null && event.key==="Tab"){
     const nodes=[...drawer.querySelectorAll("button:not([disabled])")];
     if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1)?.focus();}
     else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0]?.focus();}
   }
 });
 let touchStart=null;
 drawer.addEventListener("touchstart",event=>{if(event.touches.length===1)touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
 drawer.addEventListener("touchend",event=>{
   if(!touchStart||!event.changedTouches.length)return;
   const dy=event.changedTouches[0].clientY-touchStart.y;
   const dx=event.changedTouches[0].clientX-touchStart.x;
   if(dy>90&&dy>Math.abs(dx)*1.3&&drawer.scrollTop<5)close();
   touchStart=null;
 },{passive:true});
 function open(id){if(closing||active===id)return;opener=buttons.get(id)?.button;active=id;shade.hidden=false;drawer.hidden=false;renderDrawer();refresh();sheetEntrance(drawer);drawer.querySelector(".drawer-close")?.focus({preventScroll:true});}
 function renderDrawer(){
  if(!active)return;
  const slot=SLOTS.find(s=>s[0]===active),choices=attachments.filter(a=>a.slot===active&&a.compatibleWeapons?.includes("akm"));
  drawer.replaceChildren();
  const handle=node("div","drawer-grip");handle.setAttribute("aria-hidden","true");drawer.append(handle);
  const head=node("div","bench-drawer-head"),heading=node("div"),small=node("small","", "ATTACHMENT / "+slot[0].toUpperCase()),h=node("h3","",slot[1]),x=node("button","drawer-close","✕");
  x.type="button";x.setAttribute("aria-label","關閉選單");x.addEventListener("click",close);
  heading.append(small,h);head.append(heading,x);drawer.append(head);
  if(!getAvailableSlots(weapon,attachments,selections).has(active)||!choices.length){
    const box=node("div","empty-slot"),title=node("strong","","配件資料建置中"),p=node("p","","實機畫面確認此配件槽存在，但尚未建好完整配件與相容性資料，因此暫不提供虛構選項。");
    box.append(title,p);
    if(active==="magazine"){
      const inspect=node("button","magazine-inspect","觀察彈匣裝卸動作 ↗");
      inspect.type="button";
      inspect.addEventListener("click",async()=>{await close();inspectMagazine();});
      box.append(inspect,node("small","magazine-inspect-note","僅展示拆件方向，不變更遊戲配件或數值"));
    }
    drawer.append(box);return;
  }
  drawer.append(node("p","drawer-hint","選擇配件後即時計算面板。部分相容性仍需實機核驗。"));
  const preview=node("div","candidate-preview");
  drawer.append(preview);
  const renderPreview=id=>{
    const existing=resolveBuildPreview(selections);
    const proposed=resolveBuildPreview({...selections,[active]:id});
    preview.replaceChildren(node("small","candidate-caption","相對目前配置的變化"));
    const metrics=node("div","candidate-metrics");
    for(const [key,label] of [["recoilControl","後座"],["handling","操控"],["aimStability","穩定"],["hipFireAccuracy","腰射"]]){
      const amount=Number((proposed.stats[key]-existing.stats[key]).toFixed(2));
      const cell=node("div","candidate-metric");
      cell.append(node("span","",label),node("strong",amount>0?"positive":amount<0?"negative":"",amount===0?"—":(amount>0?"+":"")+amount));
      metrics.append(cell);
    }
    preview.append(metrics);
  };
  const wrap=node("div","bench-options");
  function makeOption(id,label,desc,provisional){
   const item=node("button","bench-option"+(selections[active]===id?" selected":""));item.type="button";
   const name=node("span","option-line"),strong=node("strong","",label);
   name.append(strong,node("small","",provisional?"相容待核驗":"示範資料"));
   item.append(name,node("span","option-effects",desc));
   item.addEventListener("pointerenter",()=>renderPreview(id));
   item.addEventListener("focus",()=>renderPreview(id));
   item.addEventListener("click",()=>{
     const previous=getAvailableSlots(weapon,attachments,selections);
     onPick(active,id);
     const available=getAvailableSlots(weapon,attachments,selections);
     for(const slot of available)if(!previous.has(slot))notifySlot(buttons.get(slot)?.button);
     notifySlot(buttons.get(active)?.button);
     swapContents(img);
     close();
   });wrap.append(item);
   if((selections[active]||"")===id)renderPreview(id);
  }
  makeOption("","不安裝配件","裸槍基準",false);
  const keyName={recoilControl:"後座",handling:"操控",aimStability:"穩定",hipFireAccuracy:"腰射",effectiveRangePct:"射程",muzzleVelocityPct:"初速"};
  for(const choice of choices){
   const desc=Object.entries(choice.effects).map(([k,v])=>(keyName[k]||k)+" "+(v>0?"+":"")+v+(k.endsWith("Pct")?"%":"")).join(" · ");
   makeOption(choice.id,choice.name,desc,choice.confidence==="slot-inferred");
  }
  drawer.append(wrap);
 }
 function refresh(){
  const open=getAvailableSlots(weapon,attachments,selections);
  for(const [id,label] of SLOTS){
   const {button,status}=buttons.get(id),installed=attachments.find(a=>a.id===selections[id]);
   const ready=open.has(id)&&attachments.some(a=>a.slot===id&&a.compatibleWeapons?.includes(weapon.id));
   button.classList.toggle("installed",!!installed);button.classList.toggle("active",active===id);
   button.classList.toggle("not-ready",!ready);
   button.setAttribute("aria-pressed",String(active===id));
   status.textContent=installed?"已安裝":ready?"可選配件":open.has(id)?"待建檔":"需掛載";
  }
 }
 refresh();return {refresh};
}