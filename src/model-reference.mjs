/**
 * Third-party Sketchfab AKM previews, not a freely editable gunsmith GLB.
 * No model is downloaded or given an implied game-origin license.
 */
export const MODELS=Object.freeze([
 {id:"gamico",title:"AKM / 分件模型候選",creator:"GAMICO",license:"CC BY",tris:10100,
  uid:"4de981b588194d42bdea5ff8a2b80d0e",
  source:"https://sketchfab.com/3d-models/akm-assault-rifle-high-quality-3d-game-asset-4de981b588194d42bdea5ff8a2b80d0e",
  note:"作者表示彈匣、槍機等是獨立零件；尚未取得原檔核對節點。"},
 {id:"kenneth",title:"AKM / 高品質展示",creator:"kennethtzh",license:"CC BY",tris:16200,
  uid:"8b6ce77441f8446786e0680d61d327db",
  source:"https://sketchfab.com/3d-models/akm-assault-rifle-game-ready-model-8b6ce77441f8446786e0680d61d327db",
  note:"已安裝側導軌與瞄具，不是遊戲 AKM 裸槍。"}
]);
const el=(name,cls,text)=>{const n=document.createElement(name);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function modelEmbedUrl(uid){
 if(!MODELS.some(m=>m.uid===uid))throw new TypeError("Model not reviewed");
 return "https://sketchfab.com/models/"+uid+"/embed?autostart=0";
}
export function initModelReference(stage){
 if(!stage)throw new TypeError("Missing weapon stage");
 const bar=el("div","model-reference-controls");
 const schematic=el("button","model-view-button selected","2D 改槍");
 const modelButton=el("button","model-view-button","Sketchfab 參考");
 const partReview=new URLSearchParams(location.search).get("partReview")==="1";
 const nativeButton=el("button","model-view-button",partReview?"分件測試 3D":"真實 AKM 3D");nativeButton.hidden=true;nativeButton.type="button";
 schematic.type=modelButton.type="button";
 bar.append(schematic,modelButton,nativeButton);stage.append(bar);
 const layer=el("div","model-reference-layer");layer.hidden=true;stage.append(layer);
 let showing=false,mode="2d",choice=MODELS[0],localViewer=null,loadGeneration=0;
 const assetUrl="./assets/models/akm-parts-candidate.glb"; // mesh separation visually confirmed, game fitment still unverified
 function sync(){
  schematic.classList.toggle("selected",!showing);
  modelButton.classList.toggle("selected",showing&&mode==="remote");
  nativeButton.classList.toggle("selected",showing&&mode==="native");
  schematic.setAttribute("aria-pressed",String(!showing));
  modelButton.setAttribute("aria-pressed",String(showing&&mode==="remote"));
  nativeButton.setAttribute("aria-pressed",String(showing&&mode==="native"));
 }
 function render(model){
  layer.replaceChildren();
  const top=el("div","reference-model-toolbar");
  const heading=el("div","reference-model-heading");
  heading.append(el("strong","",model.title),
    el("small","",model.creator+" · "+model.license+" · 約 "+model.tris.toLocaleString("en-US")+" triangles"));
  const picker=el("div","reference-model-choices");
  for(const entry of MODELS){
   const button=el("button","reference-choice"+(entry.id===model.id?" active":""),entry.id==="gamico"?"分件候選":"精緻外觀");
   button.type="button";
   button.setAttribute("aria-pressed",String(entry.id===model.id));
   button.addEventListener("click",()=>{if(choice.id!==entry.id){choice=entry;render(choice);}});
   picker.append(button);
  }
  top.append(heading,picker);
  const iframe=el("iframe","reference-model-frame");
  iframe.title=model.creator+" AKM 3D（Sketchfab）";
  iframe.src=modelEmbedUrl(model.uid);
  iframe.loading="lazy";
  iframe.referrerPolicy="strict-origin-when-cross-origin";
  iframe.setAttribute("sandbox","allow-scripts allow-same-origin allow-popups allow-forms");
  iframe.setAttribute("allow","fullscreen; autoplay; xr-spatial-tracking");
  iframe.setAttribute("allowfullscreen","");
  const footer=el("div","reference-model-footer");
  footer.append(el("p","","3D 僅供旋轉檢視；零件尚未與改槍系統連動。"+model.note));
  const link=el("a","","模型原作者／授權 ↗");
  link.href=model.source;link.target="_blank";link.rel="noopener noreferrer";
  footer.append(link);
  layer.append(iframe,top,footer);
 }
 function clearLocal(){
  loadGeneration++;
  localViewer?.dispose();localViewer=null;
 }
 function show3D(){
  if(showing&&mode==="remote")return;
  clearLocal();mode="remote";
  showing=true;stage.classList.add("is-model-preview");
  layer.hidden=false;render(choice);sync();
 }
 async function showNative(){
  if(showing&&mode==="native")return;
  clearLocal();mode="native";showing=true;
  stage.classList.add("is-model-preview");
  layer.hidden=false;layer.replaceChildren();
  const viewport=el("div","local-glb-viewport");
  const status=el("p","local-glb-status","正在載入已審核的本機模型…");
  status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  layer.append(viewport,status);sync();
  const generation=loadGeneration;
  try{
   const {mountLocalGLB}=await import("./local-viewer.mjs");
   const instance=await mountLocalGLB(viewport,{
    url:assetUrl,onStatus:message=>{if(loadGeneration===generation)status.textContent=message;}
   });
   if(loadGeneration!==generation){instance.dispose();return;}
   localViewer=instance;
   const controls=el("div","local-viewer-toolbar");
   const reset=el("button","local-viewer-action","重設視角");
   reset.type="button";reset.addEventListener("click",()=>instance.resetCamera());
   const wireframe=el("button","local-viewer-action","查看網格");
   wireframe.type="button";wireframe.setAttribute("aria-pressed","false");
   wireframe.addEventListener("click",()=>{
     const on=wireframe.getAttribute("aria-pressed")!=="true";
     instance.setWireframe(on);
     wireframe.setAttribute("aria-pressed",String(on));
     wireframe.textContent=on?"查看材質":"查看網格";
   });
   const warning=el("p","local-viewer-caveat",
    "CC0 真實 3D · "+instance.meshCount+" 個網格 · "+instance.materialCount+
    " 種材質 · 不支援 3D 配件替換，遊戲內比例仍需對照");
   controls.append(reset,wireframe,warning);
   if(instance.meshCount===2&&instance.parts.magazine.includes("AKM_Magazine")){
      const inspect=el("button","local-viewer-action","3D 彈匣裝卸示範");
      inspect.type="button";
      inspect.addEventListener("click",async()=>{
       inspect.disabled=true;
       try{await instance.animateMagazine();}finally{inspect.disabled=false;}
      });
      const inspectNote=el("p","local-viewer-caveat",
       "已確認是獨立彈匣幾何，動畫僅供檢視。不代表已核實遊戲的裝配、彈容量或換件效果。");
      controls.append(inspect,inspectNote);
   }
   if(partReview&&instance.parts.magazine.includes("AKM_Magazine")){
      const mag=el("button","local-viewer-action","隱藏候選彈匣");
      mag.type="button";let visible=true;
      mag.addEventListener("click",()=>{
       visible=!visible;
       instance.setPartVisible("AKM_Magazine",visible);
       mag.textContent=visible?"隱藏候選彈匣":"顯示候選彈匣";
      });
      const marker=el("p","local-viewer-caveat","⚠ 幾何分離實驗：用隱藏／顯示驗證是否真的只影響彈匣。並未確認遊戲裝配位置與動畫。");
      controls.append(mag,marker);
   }
   layer.append(controls);
  }catch(error){
   if(loadGeneration===generation){
    console.warn("Local AKM preview failed:",error);
    status.textContent="本機 3D 模型無法載入，請切回 2D 或 Sketchfab。";
   }
  }
 }
 function show2D(){
  if(!showing)return;
  clearLocal();showing=false;mode="2d";stage.classList.remove("is-model-preview");
  layer.hidden=true;layer.replaceChildren();sync();
 }
 schematic.addEventListener("click",show2D);
 modelButton.addEventListener("click",show3D);
 nativeButton.addEventListener("click",showNative);
 // Do not expose an empty GLB mode. A real asset must first exist in the repo.
 fetch(assetUrl,{method:"HEAD",cache:"no-store"}).then(response=>{
  const type=response.headers.get("content-type")||"";
  if(response.ok&&!type.includes("text/html"))nativeButton.hidden=false;
 }).catch(()=>{});
 sync();
 return {show3D,show2D,showNative,get is3D(){return showing;},get isNative(){return mode==="native";}};
}
