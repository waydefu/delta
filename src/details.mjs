import {validateObservationSet,findMeasuredRecoil} from "./measurements.mjs";
import { swapContents } from "./motion.mjs";
import {parsePrecisionMode,resolvePrecisionView,validatePrecisionCatalog} from "./precision.mjs";

const el=(tag,cls,value)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(value!==undefined)e.textContent=String(value);
 return e;
};
function svgGraphic(markup,label) {
 const wrap=el("div","detail-graphic");
 wrap.setAttribute("aria-label",label);
 wrap.setAttribute("role","img");
 // Static, authored SVG; no user-controlled input is interpolated.
 wrap.innerHTML=markup;
 return wrap;
}
function caption(text){return el("p","graphic-caption",text);}
function damage(){
 const root=el("div","graphics-grid graphics-damage");
 const anatomy=el("div","graphic-card");
 anatomy.append(el("span","graphic-kicker","HIT LOCATION / BASE DAMAGE"));
 anatomy.append(svgGraphic('<svg viewBox="0 0 380 310" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="armor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#344b4c"/><stop offset="1" stop-color="#162a32"/></linearGradient></defs><path d="M171 54 C153 53 148 33 152 17 C156 0 187 -3 202 13 C219 32 203 52 197 55 L194 70 L230 78 L253 102 L268 165 L248 176 L230 131 L221 191 L213 286 L190 288 L187 208 L175 208 L166 288 L143 286 L137 191 L130 132 L112 178 L91 166 L107 100 L133 79 L168 70Z" fill="url(#armor)" stroke="#7c9994" stroke-width="1.5"/><path d="M151 88 H211 L224 146 H136Z" fill="#254139" stroke="#6aab8b" stroke-width="1.5"/><path d="M140 147 H222 L217 191 H143Z" fill="#263739" stroke="#879d92"/><g fill="#cce2b2" font-family="monospace" font-size="19" font-weight="700"><text x="226" y="30">76</text><text x="238" y="118">40</text><text x="229" y="177">36</text><text x="62" y="163">16</text><text x="225" y="267">16</text></g><g stroke="#aac6ad" stroke-width="1" fill="none" opacity=".65"><path d="M201 30 H220"/><path d="M215 118 H230"/><path d="M213 173 H223"/><path d="M97 158 H69"/><path d="M205 265 H216"/></g></svg>','頭部76、胸部40、腹部36、四肢16的原始傷害人體示意圖'));
 anatomy.append(caption("部位傷害來自提供的遊戲內 AKM 裸槍截圖。"));
 const curve=el("div","graphic-card");
 curve.append(el("span","graphic-kicker","DAMAGE FALLOFF / REFERENCE"));
 curve.append(svgGraphic('<svg viewBox="0 0 380 310" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#42605a" stroke-width=".8" stroke-dasharray="3 5"><path d="M44 45 H346 M44 102 H346 M44 159 H346 M44 216 H346"/><path d="M119 40 V250 M195 40 V250 M270 40 V250"/></g><g stroke="#7f9d93" stroke-width="1.2"><path d="M44 32 V250 H350" fill="none"/></g><g fill="#94ada3" font-size="12" font-family="monospace"><text x="15" y="49">1.0</text><text x="20" y="112">0.8</text><text x="20" y="170">0.6</text><text x="40" y="269">0</text><text x="109" y="269">25</text><text x="184" y="269">50</text><text x="259" y="269">75</text><text x="326" y="269">100m</text></g><path d="M44 46 H164 V91 H254 V145 H346" fill="none" stroke="#c4df9a" stroke-width="3" stroke-linejoin="round"/><path d="M44 46 H164 V91 H254 V145 H346 V250 H44Z" fill="#c4df9a" opacity=".05"/><g fill="#c4df9a"><circle cx="164" cy="46" r="4"/><circle cx="254" cy="91" r="4"/></g><text x="47" y="298" fill="#cfb991" font-size="12">SCHEMATIC — NOT CALIBRATED</text></svg>','AKM 傷害衰減階梯曲線形狀示意，未數位化準確衰減節點或倍率'));
 curve.append(caption("階梯形狀參考遊戲截圖；轉折位置與衰減倍率尚未驗證，不可據此計算實際遠距傷害。"));
 root.append(anatomy,curve);
 return root;
}
function recoil(observations,installedIds,estimatedScore){
 const root=el("div","graphics-grid graphics-recoil");
 const sources=[["BASE PROFILE / VERIFIED ONLY",[]],["CURRENT BUILD / VERIFIED ONLY",installedIds]];
 for(const [title,ids] of sources){
  const card=el("div","graphic-card");
  card.append(el("span","graphic-kicker",title));
  const observation=findMeasuredRecoil(observations,ids);
  const points=observation?.shotPoints||[];
  const circles=points.map(p=>
   '<circle cx="'+(125+p.x)+'" cy="'+(150-p.y)+'" r="3.8" fill="#bcd9b5" opacity=".85"/>'
  ).join("");
  const grid='<svg viewBox="0 0 250 310" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+
   '<g fill="none" stroke="#344d49" stroke-width="1"><circle cx="125" cy="150" r="100"/><circle cx="125" cy="150" r="60"/><circle cx="125" cy="150" r="20"/>'+
   '<path d="M125 24 V276 M19 150 H231" stroke-dasharray="4 6"/></g>'+circles+'</svg>';
  card.append(svgGraphic(grid,observation?"有來源的連射實測點位":"無實測座標的空白射擊靶，不代表實際後座力"));
  if(!observation)card.append(el("div","graphic-overlay-note","尚無可核對的\n逐發彈著座標"));
  card.append(caption(observation?
   "遊戲版本："+observation.gameVersion+" · "+observation.shotPoints.length+" 發／由 "+observation.source+" 取得":
   "未以槍械控制值 "+estimatedScore+" 推導虛構彈孔；待有實測才會顯示。"));
  root.append(card);
 }
 return root;
}
function handling(){
 const card=el("div","graphic-card graphic-wide");
 card.append(el("span","graphic-kicker","TIMING / UNMODIFIED AKM"));
 const timings=[["開鏡","327 ms",327],["跑射延遲","209 ms",209],["換彈","2.10 s",2100],["空倉換彈","2.42 s",2420]];
 for(const [label,value,ms] of timings){
  const row=el("div","timing-row"),head=el("div","timing-head");
  head.append(el("span","",label),el("strong","",value));
  const track=el("div","timing-track"),bar=el("div","timing-bar");
  bar.style.width=(ms/2500*100)+"%";
  track.append(bar);row.append(head,track);card.append(row);
 }
 card.append(caption("按同一 2.5 秒刻度呈現，均為裸槍測得的遊戲面板數據。配件裝上後的細項時間仍需驗證。"));
 return card;
}
function stability(){
 const card=el("div","graphic-card graphic-wide graphic-centered");
 card.append(el("span","graphic-kicker","BREATH SWAY / REFERENCE"));
 card.append(svgGraphic('<svg viewBox="0 0 400 245" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="translate(200,120)" fill="none" stroke="#45685f"><circle r="104"/><circle r="73"/><circle r="40"/><path d="M-131 0 H131 M0 -120 V120" stroke-dasharray="4 6"/></g><circle cx="200" cy="120" r="21" fill="#b4d6af" opacity=".09" stroke="#a5d5b0" stroke-width="2"/><path d="M159 109 Q178 74 200 109 Q220 144 241 109" fill="none" stroke="#c4df9a" stroke-width="2.5"/><g font-family="monospace" text-anchor="middle" fill="#c6dfae"><text x="200" y="35" font-size="22">0.4°</text><text x="200" y="223" font-size="13">屏息 20 秒</text></g></svg>','AKM 呼吸晃動範圍0.4度及屏息20秒的視覺參考'));
 card.append(caption("呼吸晃動與屏息數值已由裸槍截圖核對。線條是設計示意，不是實際鏡頭移動軌跡。"));
 return card;
}
function hipfire(){
 const card=el("div","graphic-card graphic-wide graphic-centered");
 card.append(el("span","graphic-kicker","HIP FIRE / ANGULAR SPREAD"));
 card.append(svgGraphic('<svg viewBox="0 0 420 290" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="translate(210,145)" fill="none"><circle r="112" stroke="#d88d8d" stroke-width="2" opacity=".8"/><circle r="45.4" stroke="#a9d6bc" stroke-width="3"/><circle r="14" stroke="#86bbae" opacity=".35"/><path d="M-130 0 H130 M0 -130 V130" stroke="#526a65" stroke-dasharray="4 6"/></g><text x="234" y="106" font-size="17" fill="#b8e1c0">2.33°</text><text x="324" y="60" font-size="18" fill="#ebad9f">5.75°</text><text x="210" y="281" text-anchor="middle" font-size="12" fill="#95aaa1">半徑比例約 2.33 : 5.75</text></svg>','AKM 腰際射擊精度2.33度初始範圍與5.75度最大散布，圈半徑按角度比示意'));
 card.append(caption("圈的相對大小依照實機角度數值繪製；這是範圍比較，不是子彈隨機分布或實際命中機率。"));
 return card;
}
const GRAPHICS={damage,handling,stability,hipfire};
const SCORE={damage:"40",recoil:"39",handling:"54",stability:"55",hipfire:"53"};
export async function initDetails(mount,options={}){
 const [response,measured,protocolResponse,observationResponse]=await Promise.all([
  fetch("./data/weapons/akm-details.json"),
  fetch("./data/research/akm-measurements.json"),
  fetch("./data/research/akm-precision-protocol.json"),
  fetch("./data/research/akm-precision-observations.json")
 ]);
 if(!response.ok||!measured.ok||!protocolResponse.ok||!observationResponse.ok)
  throw new Error("AKM 詳細屬性、精調規則或實測來源讀取失敗");
 const data=await response.json();
 const observations=validateObservationSet(await measured.json());
 const protocol=await protocolResponse.json();
 const precisionArchive=await observationResponse.json();
 validatePrecisionCatalog(protocol,precisionArchive);
 const tabs=el("div","details-tabs"),body=el("div","detail-body");
 tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","AKM 五類詳細屬性");
 body.setAttribute("role","tabpanel");
 const toolbar=el("div","precision-toolbar");
 const modeGroup=el("div","precision-mode-controls");
 modeGroup.setAttribute("role","group");
 modeGroup.setAttribute("aria-label","精調比較模式");
 const intro=el("div","precision-intro");
 intro.append(el("strong","","精調／詳細倍率"),el("small","","未精調與精調後分開呈現；不以控制點數換算垂直或水平倍率"));
 const note=el("p","precision-evidence-note");
 const guideBox=el("div","precision-guide-box");
 toolbar.append(intro,modeGroup,note,guideBox);
 mount.append(toolbar,tabs,body);
 let active=data.groups[0].id;
 let currentStats={...data.base};
 let installedIds=[];
 let currentParts=[];
 let precisionMode=parsePrecisionMode(options.initialMode);
 const modeButtons=[];
 const buttons=[];
 const render=()=>{
  const group=data.groups.find(g=>g.id===active);
  if(!group)return;
  for(const b of buttons){
   const chosen=b.dataset.key===active;
   b.classList.toggle("active",chosen);
   b.setAttribute("aria-selected",String(chosen));
   b.tabIndex=chosen?0:-1;
  }
  body.replaceChildren();
  const precision=resolvePrecisionView(protocol,precisionArchive,currentParts,precisionMode);
  for(const b of modeButtons){
   const selected=b.dataset.mode===precisionMode;
   b.classList.toggle("selected",selected);
   b.setAttribute("aria-pressed",String(selected));
  }
  note.textContent=!precision.selectedCount?
   "裸槍細項來自實機截圖；未裝配件時無從精調。":
   precisionMode==="default"?
    "當前僅顯示配件的研究面板分數；裝配後詳細倍率尚無相同配裝的實測證據。":
    "目前沒有符合「同版手機烽火、同配裝、同精調設定」的實測結果；精調後數值一律顯示待驗證。";
  guideBox.replaceChildren();
  if(precision.selectedCount&&precisionMode!=="default"){
   if(precision.guides.length){
    guideBox.append(el("strong","precision-guide-title","常見精調維度（不代表每款配件皆可調）"));
    for(const item of precision.guides.slice(0,5)){
     const desc=item.dimensions.map(d=>d.label+"："+d.tradeoff).join("；");
     guideBox.append(el("p","precision-guide-line",item.partName+" · "+desc));
    }
    if(precision.guides.length>5)guideBox.append(el("small","", "另有 "+(precision.guides.length-5)+" 個待核對部位"));
   }else guideBox.append(el("p","precision-guide-line","目前選擇的部位沒有足夠的精調維度資料。"));
   guideBox.append(el("small","precision-guide-caution","精調幅度、可調範圍和效果公式均未核驗，暫不提供虛構滑桿。"));
  }
  const layout=el("div","detail-layout");
  const copy=el("div","detail-copy");
  const header=el("div","detail-heading");
  const heading=el("div");
  heading.append(el("small","detail-source",installedIds.length?"BASE VALUES VERIFIED · CURRENT SCORES ESTIMATED":"VERIFIED BASELINE / IN-GAME SCREENSHOT"),el("h3","",group.label));
  const score=el("div","detail-score");
  const scoreKey={damage:"fleshDamage",recoil:"recoilControl",handling:"handling",stability:"aimStability",hipfire:"hipFireAccuracy"}[group.id];
  const baseScore=data.base[scoreKey]??SCORE[group.id];
  const currentScore=currentStats[scoreKey]??baseScore;
  score.append(el("span","",installedIds.length?"當前研究試算":"裸槍數值"),el("strong","",currentScore),
    el("small","detail-score-base",installedIds.length?"裸槍 "+baseScore:""));
  header.append(heading,score);
  copy.append(header);
  const list=el("div","detail-values");
  if(installedIds.length){
    copy.append(el("p","detail-live-note","目前選裝 "+installedIds.length+" 件候選；主面板值會更新，但下列細項仍是裸槍實測值，不能從單一控制分數推算開鏡、彈道或散布。"));
  }
  const mapping=new Map((protocol.rawDetailedMetricGroups.find(x=>x.id===group.id)?.fields||[])
    .map(([key,label])=>[label,key]));
  for(const [label,value] of group.values){
   const row=el("div","detail-value");
   row.append(el("span","",label));
   const field=mapping.get(label);
   if(field){
    const comparison=precision.compareRow(field,value);
    const values=el("div","precision-detail-values");
    const baseline=el("strong","precision-baseline",comparison.baseline);
    baseline.title="來自裸槍實機截圖";
    values.append(baseline);
    if(precision.selectedCount||precisionMode==="compare"){
     const labels=precisionMode==="compare"?
      [["default","未精調",comparison.default],["tuned","精調後",comparison.tuned]]:
      [[precisionMode,precisionMode==="default"?"配裝後":"精調後",
        precisionMode==="default"?comparison.default:comparison.tuned]];
     for(const [,title,measured] of labels)
      values.append(el("span",measured===null?"precision-unverified":"precision-observed",
        title+"："+(measured??"待驗證")));
    }
    row.dataset.detailMetric=field;
    row.append(values);
   }else row.append(el("strong","",value));
   list.append(row);
  }
  copy.append(list,el("p","detail-caution","注意："+group.note));
  const visual=el("div","detail-visuals");
  visual.append(group.id==="recoil"?recoil(observations,installedIds,currentStats.recoilControl):GRAPHICS[group.id]());
  layout.append(copy,visual);body.append(layout);
  swapContents(visual);
 };
 for(const [id,label] of [["default","未精調"],["tuned","精調後"],["compare","兩者比較"]]){
  const button=el("button","precision-mode-button",label);
  button.type="button";button.dataset.mode=id;
  button.addEventListener("click",()=>{
   precisionMode=id;render();
   if(typeof options.onModeChange==="function")options.onModeChange(id);
  });
  modeButtons.push(button);modeGroup.append(button);
 }
 data.groups.forEach((g,index)=>{
  const button=el("button","detail-tab",g.label);
  button.type="button";button.dataset.key=g.id;
  button.id="detail-tab-"+g.id;
  button.setAttribute("role","tab");
  button.setAttribute("aria-controls","detail-explorer");
  button.addEventListener("click",()=>{active=g.id;render();});
  button.addEventListener("keydown",event=>{
   if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
   event.preventDefault();
   const next=event.key==="Home"?0:event.key==="End"?data.groups.length-1:(data.groups.findIndex(item=>item.id===active)+(event.key==="ArrowRight"?1:-1)+data.groups.length)%data.groups.length;
   active=data.groups[next].id;render();buttons[next].focus();
  });
  buttons.push(button);tabs.append(button);
 });
 render();
 return {
  update(stats,result){
   if(!stats||!Number.isFinite(stats.recoilControl))throw new TypeError("未提供改槍數值");
   currentStats={...stats};
   currentParts=result?.equipped||[];
   installedIds=currentParts.map(p=>p.objectId).filter(Number.isSafeInteger);
   provisional=result?.verified!==true;
   render();
  },
  setMode(mode){precisionMode=parsePrecisionMode(mode);render();},
  getMode(){return precisionMode;}
 };
}
