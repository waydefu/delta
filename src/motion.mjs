/**
 * DELTA LAB / Motion director
 * Browser-native Web Animations API: no runtime bundle or CDN dependency.
 * Transform and opacity are the only continuously animated properties.
 */
const defaults = Object.freeze({
  quick: 135,
  normal: 215,
  reveal: 300,
  long: 360,
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)"
});
let userPreference = "system";
try {
  const saved = localStorage.getItem("delta.motion");
  if(["system","off"].includes(saved)) userPreference = saved;
} catch { /* localStorage can be unavailable */ }
export function shouldAnimate() {
  if(userPreference === "off") return false;
  return typeof matchMedia !== "function" || !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function getMotionPreference() { return userPreference; }
export function setMotionPreference(preference) {
  if(!["system","off"].includes(preference)) throw new TypeError("Unknown motion preference");
  userPreference = preference;
  try { localStorage.setItem("delta.motion",preference); } catch { /* optional */ }
}
function play(element,frames,options) {
  if(!element || !shouldAnimate() || typeof element.animate !== "function") return null;
  return element.animate(frames,{fill:"none",...options});
}
export function entrance(element,delay=0) {
  return play(element,[
    {opacity:.01, transform:"translate3d(0, 13px, 0)"},
    {opacity:1, transform:"translate3d(0, 0, 0)"}
  ],{duration:defaults.reveal,delay,easing:defaults.easeOut});
}
export function emphasize(element) {
  return play(element,[
    {transform:"scale(1)",filter:"brightness(1)"},
    {transform:"scale(1.035)",filter:"brightness(1.2)"},
    {transform:"scale(1)",filter:"brightness(1)"}
  ],{duration:defaults.long,easing:defaults.easeOut});
}
export function notifySlot(element) {
  return play(element,[
    {boxShadow:"0 0 0 0 rgba(196,223,154,0)",borderColor:"rgba(196,223,154,.42)"},
    {boxShadow:"0 0 0 6px rgba(196,223,154,.22)",borderColor:"rgba(196,223,154,1)"},
    {boxShadow:"0 0 0 0 rgba(196,223,154,0)",borderColor:"rgba(196,223,154,.42)"}
  ],{duration:430,easing:defaults.easeOut});
}
export function swapContents(element) {
  return play(element,[
    {opacity:.45,transform:"translate3d(0, 5px, 0)"},
    {opacity:1,transform:"translate3d(0, 0, 0)"}
  ],{duration:defaults.normal,easing:defaults.easeOut});
}
export function sheetEntrance(element) {
  return play(element,[
    {opacity:.75,transform:"translate3d(0, 20px, 0)"},
    {opacity:1,transform:"translate3d(0, 0, 0)"}
  ],{duration:defaults.normal,easing:defaults.easeOut});
}
export async function sheetExit(element) {
  const anim = play(element,[
    {opacity:1,transform:"translate3d(0, 0, 0)"},
    {opacity:.8,transform:"translate3d(0, 13px, 0)"}
  ],{duration:defaults.quick,easing:defaults.easeIn});
  if(anim) await anim.finished.catch(()=>{});
}
export function diagramEnter(root) {
  const nodes = root?.querySelectorAll(".mount-node");
  if(!nodes)return;
  for(const [index,node] of [...nodes].entries())entrance(node,index*45);
}
export function drawLine(line) {
  if(!line || !shouldAnimate() || typeof line.getTotalLength!=="function")return;
  const length=line.getTotalLength();
  play(line,[{strokeDasharray:length,strokeDashoffset:length},{strokeDasharray:length,strokeDashoffset:0}],
       {duration:defaults.long,easing:defaults.easeOut});
}
export function countTo(node,next) {
  if(!node) return;
  // Re-entering should never create stacked interpolation loops.
  const previous=Number(node.dataset.numericValue);
  const target=Number(next);
  node.dataset.numericValue=String(next);
  if(!shouldAnimate() || !Number.isFinite(previous) || !Number.isFinite(target) || previous===target) {
    node.textContent=String(next);
    return;
  }
  const anim=play(node,[{opacity:.55,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],
       {duration:defaults.normal,easing:defaults.easeOut});
  node.textContent=String(target);
  return anim;
}
export function setupMotionToggle(button) {
  if(!button)return;
  function refresh() {
    const isOff=getMotionPreference()==="off";
    button.setAttribute("aria-pressed",String(isOff));
    button.textContent=isOff?"動效：關":"動效：自動";
    button.title=isOff?"開啟系統允許的動效":"關閉非必要動效";
  }
  button.addEventListener("click",()=>{
    setMotionPreference(getMotionPreference()==="off"?"system":"off");
    refresh();
  });
  refresh();
}
export function initializeEntrance() {
  if(!shouldAnimate())return;
  for(const [i,item] of [...document.querySelectorAll(".hero-content,.gunsmith-intro,.summary-card")].entries())entrance(item,Math.min(i,5)*55);
}
