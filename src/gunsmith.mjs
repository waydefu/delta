const SLOTS=[
 ["muzzle","槍口",9,32,8,49],
 ["barrel","槍管",24,12,30,49],
 ["charging","拉機柄",43,6,49,44],
 ["optic","瞄準鏡",65,8,61,43],
 ["canted","側瞄準器",80,16,66,46],
 ["buttpad","槍托墊",92,34,93,56],
 ["stock","槍托",92,72,82,60],
 ["reargrip","後握把",77,86,61,69],
 ["magazine","彈匣",50,88,50,73],
 ["magwell","彈匣座",62,91,52,62],
 ["foregrip","前握把",17,78,28,59]
];
const ENABLED=new Set(["muzzle","barrel","stock"]);
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
export function initGunsmith(mount,selections,attachments,onPick){
 const stage=node("div","bench-canvas");
 const grid=node("div","bench-grid");
 const img=node("img","bench-gun");img.src="./assets/akm-side.svg";img.alt="AKM 側面槍械示意圖，非原生遊戲貼圖";img.draggable=false;
 const lines=document.createElementNS("http://www.w3.org/2000/svg","svg");
 lines.classList.add("bench-lines");lines.setAttribute("viewBox","0 0 1000 560");lines.setAttribute("preserveAspectRatio","none");
 const buttons=new Map();
 stage.append(grid,img,lines);
 for(const [id,label,x,y,tx,ty] of SLOTS){
  const line=document.createElementNS("http://www.w3.org/2000/svg","line");
  for(const [key,value] of [["x1",x*10],["y1",y*5.6],["x2",tx*10],["y2",ty*5.6]])line.setAttribute(key,String(value));
  lines.append(line);
  const button=node("button","bench-slot");button.type="button";button.style.left=x+"%";button.style.top=y+"%";
  button.setAttribute("aria-label",label+"配件槽");const title=node("span","bench-slot-name",label);
  const icon=node("span","bench-slot-icon",ENABLED.has(id)?"＋":"◇");icon.setAttribute("aria-hidden","true");
  const status=node("span","bench-slot-state");button.append(title,icon,status);
  button.addEventListener("click",()=>open(id));stage.append(button);buttons.set(id,{button,status});
 }
 stage.append(node("span","bench-watermark","AKM / CONFIGURATION"));
 const shade=node("button","bench-shade");shade.type="button";shade.hidden=true;shade.setAttribute("aria-label","關閉配件選單");
 const drawer=node("aside","bench-drawer");drawer.hidden=true;drawer.setAttribute("aria-label","配件選單");
 mount.append(stage,shade,drawer);
 let active=null;
 const close=()=>{active=null;shade.hidden=true;drawer.hidden=true;refresh();};
 shade.addEventListener("click",close);
 function open(id){active=id;shade.hidden=false;drawer.hidden=false;renderDrawer();refresh();}
 function renderDrawer(){
  if(!active)return;
  const slot=SLOTS.find(s=>s[0]===active),choices=attachments.filter(a=>a.slot===active&&a.compatibleWeapons?.includes("akm"));
  drawer.replaceChildren();
  const head=node("div","bench-drawer-head"),heading=node("div"),small=node("small","", "ATTACHMENT / "+slot[0].toUpperCase()),h=node("h3","",slot[1]),x=node("button","drawer-close","✕");
  x.type="button";x.setAttribute("aria-label","關閉選單");x.addEventListener("click",close);
  heading.append(small,h);head.append(heading,x);drawer.append(head);
  if(!ENABLED.has(active)||!choices.length){
    const box=node("div","empty-slot"),title=node("strong","","配件資料建置中"),p=node("p","","實機畫面確認此配件槽存在，但尚未建好完整配件與相容性資料，因此暫不提供虛構選項。");
    box.append(title,p);drawer.append(box);return;
  }
  drawer.append(node("p","drawer-hint","選擇配件後即時計算面板。部分相容性仍需實機核驗。"));
  const wrap=node("div","bench-options");
  function makeOption(id,label,desc,provisional){
   const item=node("button","bench-option"+(selections[active]===id?" selected":""));item.type="button";
   const name=node("span","option-line"),strong=node("strong","",label);
   name.append(strong,node("small","",provisional?"相容待核驗":"示範資料"));
   item.append(name,node("span","option-effects",desc));
   item.addEventListener("click",()=>{onPick(active,id);close();});wrap.append(item);
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
  for(const [id,label] of SLOTS){
   const {button,status}=buttons.get(id),installed=attachments.find(a=>a.id===selections[id]);
   button.classList.toggle("installed",!!installed);button.classList.toggle("active",active===id);
   button.classList.toggle("not-ready",!ENABLED.has(id));
   button.setAttribute("aria-pressed",String(active===id));
   status.textContent=installed?"已安裝":ENABLED.has(id)?"可選配件":"待建檔";
  }
 }
 refresh();return {refresh};
}