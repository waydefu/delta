/**
 * Read-only all-weapon attachment research index.
 * The public upstream v0.8.0 data deliberately does NOT include
 * weapon-to-attachment fitment. Do NOT enable unknown items in the gunsmith.
 *
 * Source: https://github.com/Zhoyi011/delta-force-core
 * Package declares MIT in package.json; source data independently unverified.
 */
export const UPSTREAM={
  repository:"https://github.com/Zhoyi011/delta-force-core",
  package:"delta-force-core@0.8.0",
  module:"https://cdn.jsdelivr.net/npm/delta-force-core@0.8.0/dist/data/attachments.js",
  release:"0.8.0",
  publishedCount:564
};
const SLOT_LABELS={
 "弹匣":"彈匣","瞄准镜":"瞄具","护木":"護木","枪管":"槍管","枪口":"槍口",
 "枪托":"槍托","前握把":"前握把","后握把":"後握把","功能配件":"功能配件"
};
const METRIC_LABELS={
 addedControl:"後座力控制",addedHandling:"操控速度",
 addedAimStability:"據槍穩定性",addedHipFireAccuracy:"腰射精度",
 addedFireRate:"射速欄位",addedMuzzleVelocity:"初速欄位",
 addedEffectiveRange:"射程欄位",addedMagazineCapacity:"彈匣容量欄位",
 addedReloadTime:"換彈時間"
};
const node=(tag,cls,value)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(value!==undefined)n.textContent=String(value);
 return n;
};
export function inspectExternalPart(raw){
 if(!raw||typeof raw!=="object"||typeof raw.id!=="string"||
    typeof raw.name!=="string"||typeof raw.slot!=="string")return null;
 const stats=[];
 for(const [key,label] of Object.entries(METRIC_LABELS)){
  const val=raw[key];
  if(typeof val==="number"&&Number.isFinite(val)){
   const sign=val>0?"+":"";
   stats.push(label+" "+sign+val+(key==="addedReloadTime"?" 秒":""));
  }
 }
 return {
  id:raw.id,
  name:raw.name,
  slot:SLOT_LABELS[raw.slot]||raw.slot,
  rawSlot:raw.slot,
  tier:raw.tier??null,
  stats,
  description:typeof raw.description==="string"?raw.description:"",
  effects:Array.isArray(raw.specialEffects)?raw.specialEffects.filter(x=>typeof x==="string"):[],
  flags:{
   compatibleWithAkm:false,
   currentMobileVerified:false,
   valuesVerified:false,
   noKnownNumericModifiers:stats.length===0
  }
 };
}
export function normalizeResearchCatalog(raw){
 if(!Array.isArray(raw))throw new TypeError("外部配件格式不正確");
 const ids=new Set();
 const out=[];
 for(const item of raw){
  const part=inspectExternalPart(item);
  if(!part||ids.has(part.id))continue;
  ids.add(part.id);out.push(part);
 }
 return out;
}
export function initResearchCatalog(host,curated){
 if(!host)throw new TypeError("缺少配件研究容器");
 const local=curated.map(p=>({
  id:p.id,name:p.name,slot:p.slot,
  tier:null,
  stats:Object.entries(p.effects||{}).map(([key,value])=>key+" "+(value>0?"+":"")+value),
  description:p.dataStatus==="source-conflict"?"來源有衝突":"資料仍待實機核驗",
  effects:[],source:p.source,
  flags:{compatibleWithAkm:false,currentMobileVerified:false,valuesVerified:false,noKnownNumericModifiers:false}
 }));
 let all=[],results=local,loaded=false,index=0;
 const heading=node("div","research-directory-head");
 const intro=node("p","muted","目前 17 件 AKM 研究配件可供試算；全量目錄是所有槍械的候選品項，不代表 AKM 可安裝，亦不代表數值已經過 2026 手遊驗證。");
 const header=node("div","research-directory-controls");
 const search=node("input","research-search");
 search.type="search";search.placeholder="搜尋名稱或配件 ID（例如 AKM、前握把）";
 search.setAttribute("aria-label","搜尋配件候選");
 const category=node("select","research-category");
 category.setAttribute("aria-label","篩選配件類別");
 const load=node("button","research-load","載入全量社群候選目錄");
 load.type="button";
 const status=node("p","research-directory-status","本機研究：17 件 · 未有任何已驗證可裝的全量資料");
 status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const list=node("div","research-results");
 const more=node("button","research-more","顯示更多");more.type="button";more.hidden=true;
 const sourceLink=node("a","research-directory-source","社群資料來源、版本與限制 ↗");
 sourceLink.href=UPSTREAM.repository;sourceLink.target="_blank";sourceLink.rel="noopener noreferrer";
 header.append(search,category,load);
 heading.append(intro,header,status,sourceLink);
 host.append(heading,list,more);
 function updateCategories(){
  const value=category.value;
  category.replaceChildren(new Option("全部類別",""));
  const options=[...new Set((loaded?all:local).map(x=>x.slot))].sort();
  for(const name of options)category.add(new Option(name,name));
  if(options.includes(value))category.value=value;
 }
 function paintBatch(){
  const end=Math.min(index+35,results.length);
  const fragment=document.createDocumentFragment();
  for(;index<end;index++){
   const part=results[index];
   const card=node("article","research-result");
   const top=node("div","research-result-top");
   top.append(node("strong","research-result-name",part.name),
     node("span","research-result-slot",part.slot+(part.tier?" · T"+part.tier:"")));
   const id=node("small","research-result-id",part.id);
   const metrics=node("div","research-result-metrics",
     part.stats.length?part.stats.join(" · "):"目前來源未提供可計算的數值欄位");
   const foot=node("small","research-result-note",
     loaded?"全武器目錄 · AKM 相容性未核驗 · 數值與版本待驗證":part.description);
   card.append(top,id,metrics,foot);
   if(part.effects?.length)card.append(node("p","research-result-extra","特殊文字："+part.effects.join(" · ")));
   if(part.source){
    const link=node("a","research-result-source","查看個別來源 ↗");
    link.href=part.source;link.target="_blank";link.rel="noopener noreferrer";card.append(link);
   }
   fragment.append(card);
  }
  list.append(fragment);
  more.hidden=index>=results.length;
 }
 function filter(){
  const query=search.value.trim().toLocaleLowerCase();
  const slot=category.value;
  results=(loaded?all:local).filter(p=>(!slot||p.slot===slot)&&(!query||
   p.name.toLocaleLowerCase().includes(query)||p.id.toLowerCase().includes(query)));
  index=0;list.replaceChildren();
  paintBatch();
  status.textContent=(loaded?"全武器候選 ":"AKM 已研究 ")+results.length+
    " 件"+(loaded?" · 不能直接套用 AKM":" · 配件數值尚未經現版實機核驗");
 }
 updateCategories();filter();
 search.addEventListener("input",filter);
 category.addEventListener("change",filter);
 more.addEventListener("click",paintBatch);
 load.addEventListener("click",async()=>{
  if(loaded)return;
  load.disabled=true;load.textContent="取得來源資料中…";
  try{
   // Official package distribution via pinned CDN, no copied third-party dataset.
   const module=await import(UPSTREAM.module);
   if(!Array.isArray(module.ATTACHMENTS))throw new Error("此版本無 ATTACHMENTS 資料");
   all=normalizeResearchCatalog(module.ATTACHMENTS);
   if(!all.length)throw new Error("外部資料為空");
   loaded=true;
   load.textContent="已載入全武器候選："+all.length+" 件";
   updateCategories();filter();
  }catch(error){
   console.warn("Optional research index unavailable:",error);
   load.disabled=false;load.textContent="重新讀取全量社群候選";
   status.textContent="外部目錄暫時無法載入；17 件本機 AKM 研究資料仍可正常使用。";
  }
 });
 return {get loaded(){return loaded;},refresh:filter};
}
