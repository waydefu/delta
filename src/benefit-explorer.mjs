import {getYieldGroups,getYieldRows,isCurrentDetailKnown} from "./benefit-data.mjs";

const node=(tag,className,value)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(value!==undefined)el.textContent=String(value);
  return el;
};
const svgNode=(tag,attrs={},value)=>{
  const el=document.createElementNS("http://www.w3.org/2000/svg",tag);
  for(const [key,v] of Object.entries(attrs))el.setAttribute(key,String(v));
  if(value!==undefined)el.textContent=String(value);
  return el;
};
function fmt(value,unit="") {
  if(value===null||value===undefined)return "—";
  const digits=unit==="×"?2:unit==="ms"?0:2;
  return Number(value).toLocaleString("zh-TW",{minimumFractionDigits:unit==="×"?2:0,maximumFractionDigits:digits})+(unit?" "+unit:"");
}
function pct(value) {
  if(value===null||value===undefined)return "無法計算";
  const n=Math.abs(value)<0.00001?0:value;
  return (n>0?"+":"")+n.toLocaleString("zh-TW",{maximumFractionDigits:2})+"%";
}
function drawEvidencePlot(root,rows,metric){
  root.replaceChildren();
  const svg=svgNode("svg",{viewBox:"0 0 690 260",role:"img","aria-label":metric.label+"：0 至 100 分的已記錄實測點；沒有觀測的分數不連線"});
  const observed=rows.filter(row=>row.value!==null);
  const left=65,right=658,top=23,bottom=205;
  const values=observed.map(row=>row.value);
  const lo=Math.min(...values),hi=Math.max(...values);
  const pad=Math.max(0.05,(hi-lo)*0.35,Math.abs(lo)*0.045);
  const yMin=Math.max(0,lo-pad),yMax=hi+pad;
  const x=score=>left+score/100*(right-left);
  const y=value=>bottom-(value-yMin)/(yMax-yMin)*(bottom-top);
  for(const fraction of [0,.25,.5,.75,1]){
    const yPos=bottom-fraction*(bottom-top);
    svg.append(svgNode("line",{x1:left,y1:yPos,x2:right,y2:yPos,stroke:"#657872","stroke-dasharray":"3 5",opacity:".6"}));
    svg.append(svgNode("text",{x:left-10,y:yPos+4,"text-anchor":"end",fill:"#a4b8af","font-size":"11"},fmt(yMin+fraction*(yMax-yMin),metric.unit)));
  }
  for(const score of [0,25,50,75,100]){
    svg.append(svgNode("text",{x:x(score),y:231,"text-anchor":"middle",fill:"#a4b8af","font-size":"11"},score));
  }
  svg.append(svgNode("text",{x:(left+right)/2,y:252,"text-anchor":"middle",fill:"#c4df9a","font-size":"12"},"面板分數（0–100）"));
  svg.append(svgNode("line",{x1:left,y1:bottom,x2:right,y2:bottom,stroke:"#85988d"}));
  svg.append(svgNode("line",{x1:left,y1:top,x2:left,y2:bottom,stroke:"#85988d"}));
  for(const row of observed){
    const point=svgNode("circle",{cx:x(row.score),cy:y(row.value),r:6,fill:"#c4df9a",stroke:"#13251e","stroke-width":2});
    point.append(svgNode("title",{},row.score+" 點： "+fmt(row.value,metric.unit)+"；收益 "+pct(row.benefit)));
    svg.append(point);
  }
  root.append(svg);
  root.append(node("p","yield-plot-note",
    "已記錄 "+observed.length+" / 101 個分數。散點之間沒有實測，故不連線、不補值、不推估遞減收益。"));
}

export async function initBenefitExplorer(mount) {
  if(!mount)return {update(){}};
  const responses=await Promise.all([
    fetch("./data/weapons/akm-details.json"),
    fetch("./data/research/akm-precision-protocol.json"),
    fetch("./data/research/akm-benefit-samples.json")
  ]);
  if(responses.some(response=>!response.ok))throw new Error("收益實測索引讀取失敗");
  const [details,protocol,dataset]=await Promise.all(responses.map(response=>response.json()));
  const groups=getYieldGroups(details,protocol);
  const historical=dataset.reference.historical;
  const selectors=node("div","yield-controls");
  const groupLabel=node("label","", "主屬性");
  const groupSelect=node("select","yield-select");
  groupSelect.id="yield-score-group";
  for(const group of groups)groupSelect.append(new Option(group.label,group.id));
  groupLabel.htmlFor=groupSelect.id;
  const metricLabel=node("label","","實際細項");
  const metricSelect=node("select","yield-select");
  metricSelect.id="yield-detail-metric";
  metricLabel.htmlFor=metricSelect.id;
  const sourceLabel=node("label","","資料組別");
  const sourceSelect=node("select","yield-select");
  sourceSelect.id="yield-evidence-source";
  sourceSelect.append(new Option("2026 手機烽火｜裸槍基準","mobile"));
  sourceSelect.append(new Option("2025 全面戰場｜歷史參考","historical"));
  sourceLabel.htmlFor=sourceSelect.id;
  const wrapControl=(label,control)=>{const wrap=node("div","yield-control");wrap.append(label,control);return wrap;};
  selectors.append(wrapControl(groupLabel,groupSelect),wrapControl(metricLabel,metricSelect),wrapControl(sourceLabel,sourceSelect));
  const summary=node("div","yield-summary");
  summary.setAttribute("aria-live","polite");
  const notice=node("p","yield-evidence-warning");
  const chart=node("div","yield-chart");
  const scroll=node("div","yield-table-scroll");
  scroll.tabIndex=0;
  scroll.setAttribute("aria-label","0 到 100 各分數的實測收益表，可捲動");
  const table=node("table","yield-table");
  const thead=node("thead");
  const tr=node("tr");
  for(const label of ["面板分數","實測細項","相對裸槍收益","資料狀態"]){const th=node("th","",label);th.scope="col";tr.append(th);}
  thead.append(tr);table.append(thead);
  const tbody=node("tbody");table.append(tbody);scroll.append(table);
  const links=node("div","yield-source-links");
  mount.append(selectors,summary,notice,chart,scroll,links);
  let activeGroup="recoil";
  let activeMetric="autoVerticalRecoilMultiplier";
  let source="mobile";
  let currentStats={...details.base},equippedCount=0;
  function render(){
    const group=groups.find(g=>g.id===activeGroup)||groups[0];
    const metric=group.metrics.find(m=>m.key===activeMetric)||group.metrics[0];
    if(metric.key!==activeMetric)activeMetric=metric.key;
    const hasHistory=group.id==="recoil";
    sourceSelect.options[1].disabled=!hasHistory;
    if(!hasHistory&&source==="historical")source="mobile";
    sourceSelect.value=source;
    const archive=source==="historical"?historical:null;
    const rows=getYieldRows(group,metric.key,archive);
    const currentScore=currentStats[group.scoreField];
    const currentRow=rows.find(row=>row.score===currentScore);
    summary.replaceChildren();
    const columns=[
      ["裸槍分數",group.baseScore+" 點"],
      ["目前試算",Number.isFinite(currentScore)?currentScore+" 點":"未知"],
      ["當前細項",isCurrentDetailKnown(currentScore,group,equippedCount,archive)?
        fmt(metric.baseValue,metric.unit)+"（裸槍）":"待驗證"],
      ["實際收益",isCurrentDetailKnown(currentScore,group,equippedCount,archive)?
        pct(currentRow?.benefit):"無法計算"]
    ];
    for(const [name,value] of columns){
      const item=node("div","yield-summary-item");
      item.append(node("span","",name),node("strong","",value));summary.append(item);
    }
    notice.textContent=archive?
      "歷史資料：2025-02-12 玩家在「全面戰場」測得的 AKM 點位，原文未證明是台灣手機烽火；不得當成目前遊戲版本的公式，也不能和現行配裝直接比較。":
      "現行資料僅有 2026-10-23 手機烽火 AKM 裸槍截圖；配件裝上後即使總分相同，也不能假設詳細倍率不變。未採用任何自訂換算曲線。";
    drawEvidencePlot(chart,rows,metric);
    tbody.replaceChildren();
    const fragment=document.createDocumentFragment();
    for(const row of rows){
      const tr=node("tr",row.value===null?"yield-empty":"yield-observed");
      if(row.score===group.baseScore)tr.classList.add("yield-baseline");
      if(row.score===currentScore)tr.classList.add("yield-current");
      const cells=[
        row.score+(row.score===group.baseScore?" · 裸槍":"")+(row.score===currentScore?" · 目前":""),
        fmt(row.value,metric.unit),
        row.benefit===null?"—":pct(row.benefit),
        row.status
      ];
      for(const value of cells)tr.append(node("td","",value));
      fragment.append(tr);
    }
    tbody.append(fragment);
    links.replaceChildren();
    const link=node("a","yield-source-link","檢查資料來源 ↗");
    link.href=archive?historical.source:"https://github.com/waydefu/delta/blob/main/data/weapons/akm-details.json";
    link.rel="noopener noreferrer";link.target="_blank";
    links.append(link);
    links.append(node("span","","收益公式：較低越好＝(基準−實測)÷基準；較高越好＝(實測−基準)÷基準。方向不明或缺樣本時顯示「無法計算」。"));
  }
  function changeGroup(){
    activeGroup=groupSelect.value;
    metricSelect.replaceChildren();
    for(const metric of groups.find(g=>g.id===activeGroup).metrics)
      metricSelect.append(new Option(metric.label,metric.key));
    activeMetric=metricSelect.value;
    render();
  }
  groupSelect.addEventListener("change",changeGroup);
  metricSelect.addEventListener("change",()=>{activeMetric=metricSelect.value;render();});
  sourceSelect.addEventListener("change",()=>{source=sourceSelect.value;render();});
  groupSelect.value=activeGroup;
  changeGroup();
  return {
    update(stats,result){
      currentStats=stats||details.base;
      equippedCount=result?.equipped?.length||0;
      render();
    }
  };
}
