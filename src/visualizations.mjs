
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const fmt=n=>Number(n).toLocaleString("zh-TW",{maximumFractionDigits:2});
export function renderMountGraph(root, barrel){
  if(!root)return;
  root.replaceChildren();
  const heading=el("div","mount-root");
  heading.append(el("strong","",barrel ? "AKM → "+barrel.name : "AKM → 裸槍／預設結構"),el("span","",barrel?"槍管已選裝":"尚未更換槍管"));
  root.append(heading);
  const links=el("div","mount-links");
  const samples=[["護木／導軌","front"],["前握把掛載","under"],["光學／側瞄座","top"]];
  for(const [label] of samples){
    const item=el("div","mount-node");
    item.dataset.state=barrel?"conditional":"unresolved";
    item.append(el("strong","",label),el("small","",barrel?"條件結構・相容待查":"需確認相容性"));
    links.append(item);
  }
  root.append(links);
  root.append(el("small","", "注意：此圖為依附關係示意，不代表所有 AKM 槍管都會新增上述槽位。"));
}
export function renderContributions(root,weapon,result){
  if(!root)return;
  root.replaceChildren();
  const base=weapon.base.recoilControl;
  const total=result.stats.recoilControl;
  const top=el("div","contrib-total");
  top.append(el("span","", "後座力控制 / "+base+" 基礎"),el("strong","",fmt(total)+" "+(total>base?"↑":total<base?"↓":"—")));
  root.append(top);
  const bar=el("div","contrib-bar");
  const items=result.equipped.map(item=>({label:item.name,amount:item.effects.recoilControl||0}));
  const positives=items.filter(x=>x.amount>0);
  const negatives=items.filter(x=>x.amount<0);
  const scale=Math.max(60,base+positives.reduce((sum,x)=>sum+x.amount,0)+Math.abs(negatives.reduce((sum,x)=>sum+x.amount,0)));
  const basePiece=el("div","contrib-piece base");basePiece.style.width=(base/scale*100)+"%";bar.append(basePiece);
  for(const a of positives){const p=el("div","contrib-piece");p.style.width=(a.amount/scale*100)+"%";bar.append(p);}
  for(const a of negatives){const p=el("div","contrib-piece negative");p.style.width=(Math.abs(a.amount)/scale*100)+"%";bar.append(p);}
  root.append(bar);
  const baseline=el("div","contrib-item");baseline.append(el("span","","AKM 裸槍"),el("b","",fmt(base)));root.append(baseline);
  for(const a of items){
    if(a.amount===0)continue;
    const r=el("div","contrib-item "+(a.amount>0?"positive":"negative"));
    r.append(el("span","",a.label),el("b","",(a.amount>0?"+":"")+fmt(a.amount)));root.append(r);
  }
  if(items.every(x=>x.amount===0))root.append(el("p","tiny","選裝影響後座力的配件後，這裡會拆解各個來源。"));
}
export function renderFlightChart(root,baseVelocity,currentVelocity){
  if(!root)return;
  root.replaceChildren();
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 660 210");
  svg.setAttribute("role","presentation");
  const add=(tag,attrs,text)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;svg.append(e);return e;};
  const left=48,right=636,top=20,bottom=170;
  const maxTime=200/Math.min(baseVelocity,currentVelocity)*1000*1.14;
  const mapX=d=>left+(d/200)*(right-left);
  const mapY=(d,v)=>bottom-((d/v*1000)/maxTime)*(bottom-top);
  for(const value of [0,0.25,0.5,0.75,1]){
    const y=bottom-(bottom-top)*value;
    add("line",{x1:left,y1:y,x2:right,y2:y,stroke:"#526b61","stroke-width":".7","stroke-dasharray":"3 5",opacity:".62"});
    add("text",{x:38,y:y+4,"text-anchor":"end","font-size":"10",fill:"#8ea9a0"},fmt(maxTime*value));
  }
  for(const d of [0,50,100,150,200]){
    const x=mapX(d);add("text",{x,y:194,"text-anchor":"middle","font-size":"10",fill:"#8ea9a0"},d+"m");
  }
  const points=v=>[0,25,50,75,100,125,150,175,200].map(d=>mapX(d)+","+mapY(d,v)).join(" ");
  add("polyline",{points:points(baseVelocity),stroke:"#869a94","stroke-width":"2",fill:"none","stroke-dasharray":"6 5"});
  add("polyline",{points:points(currentVelocity),stroke:"#c4df9a","stroke-width":"3",fill:"none"});
  add("circle",{cx:mapX(200),cy:mapY(200,currentVelocity),r:"4",fill:"#c4df9a"});
  root.append(svg);
}
