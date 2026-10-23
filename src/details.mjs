const el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
export async function initDetails(mount){
 const response=await fetch("./data/weapons/akm-details.json");
 if(!response.ok)throw new Error("詳細屬性資料讀取失敗");
 const data=await response.json(),tabs=el("div","details-tabs"),body=el("div","detail-body");
 tabs.setAttribute("role","tablist");body.setAttribute("role","tabpanel");
 mount.append(tabs,body);let active=data.groups[0].id;const buttons=[];
 const render=()=>{
  const group=data.groups.find(g=>g.id===active);
  for(const button of buttons){const ok=button.dataset.key===active;button.classList.toggle("active",ok);button.setAttribute("aria-selected",String(ok));}
  body.replaceChildren();
  const heading=el("div","detail-heading");heading.append(el("h3","",group.label),el("span","","2026-10-23 · 實機裸槍基準"));
  const values=el("div","detail-values");
  for(const [label,value] of group.values){const row=el("div","detail-value");row.append(el("span","",label),el("strong","",value));values.append(row);}
  body.append(heading,values,el("p","detail-caution","⚠ "+group.note));
 };
 for(const group of data.groups){const b=el("button","detail-tab",group.label);b.type="button";b.dataset.key=group.id;b.setAttribute("role","tab");b.addEventListener("click",()=>{active=group.id;render();});buttons.push(b);tabs.append(b);}
 render();
}