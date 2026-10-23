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
 const modelButton=el("button","model-view-button","3D 槍模");
 schematic.type=modelButton.type="button";
 bar.append(schematic,modelButton);stage.append(bar);
 const layer=el("div","model-reference-layer");layer.hidden=true;stage.append(layer);
 let showing=false,choice=MODELS[0];
 function sync(){
  schematic.classList.toggle("selected",!showing);
  modelButton.classList.toggle("selected",showing);
  schematic.setAttribute("aria-pressed",String(!showing));
  modelButton.setAttribute("aria-pressed",String(showing));
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
 function show3D(){
  if(showing)return;
  showing=true;stage.classList.add("is-model-preview");
  layer.hidden=false;render(choice);sync();
 }
 function show2D(){
  if(!showing)return;
  showing=false;stage.classList.remove("is-model-preview");
  layer.hidden=true;layer.replaceChildren();sync();
 }
 schematic.addEventListener("click",show2D);
 modelButton.addEventListener("click",show3D);
 sync();
 return {show3D,show2D,get is3D(){return showing;}};
}
