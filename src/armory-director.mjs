/**
 * ACFH 2.0 scene director.
 * Tiny interaction-only compositor transforms. No eager 3D, canvas, timers,
 * pointer capture, or dependencies; the default scene is fully static.
 */
import {shouldAnimate} from "./motion.mjs";

export function cinematicMotionAllowed({reduced,coarse,enabled,visible=true}){
 return Boolean(!reduced&&!coarse&&enabled&&visible);
}
export function normalizedLook(clientX,clientY,bounds){
 if(!bounds||bounds.width<=0||bounds.height<=0)return {x:0,y:0};
 const clamp=v=>Math.max(-1,Math.min(1,v));
 return {
  x:clamp((clientX-bounds.left-bounds.width/2)/(bounds.width/2)),
  y:clamp((clientY-bounds.top-bounds.height/2)/(bounds.height/2))
 };
}
export function initArmoryDirector(root=document){
 const hero=root.querySelector(".hero.hero-editorial");
 if(!hero)return {dispose(){}};
 const artwork=hero.querySelector(".hero-cinema-weapon img");
 if(artwork){
  artwork.addEventListener("error",()=>{
   if(artwork.dataset.fallbackUsed)return;
   artwork.dataset.fallbackUsed="true";
   artwork.src="./assets/akm-side.svg";
   artwork.classList.add("is-fallback");
  },{once:true});
 }
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
 const coarse=window.matchMedia("(pointer: coarse)");
 let visible=true,frame=0,disposed=false,look={x:0,y:0};
 const canMove=()=>cinematicMotionAllowed({
  reduced:reduced.matches,coarse:coarse.matches,enabled:shouldAnimate(),visible
 });
 const reset=()=>{
  if(frame){cancelAnimationFrame(frame);frame=0;}
  for(const [key,value] of Object.entries({
   "--cinema-x":"0px","--cinema-y":"0px",
   "--cinema-far-x":"0px","--cinema-far-y":"0px"
  }))hero.style.setProperty(key,value);
 };
 const paint=()=>{
  frame=0;
  if(!canMove()){reset();return;}
  hero.style.setProperty("--cinema-x",(look.x*11).toFixed(2)+"px");
  hero.style.setProperty("--cinema-y",(look.y*7).toFixed(2)+"px");
  hero.style.setProperty("--cinema-far-x",(look.x*-4).toFixed(2)+"px");
  hero.style.setProperty("--cinema-far-y",(look.y*-3).toFixed(2)+"px");
 };
 const move=event=>{
  if(!canMove()){reset();return;}
  look=normalizedLook(event.clientX,event.clientY,hero.getBoundingClientRect());
  if(!frame)frame=requestAnimationFrame(paint);
 };
 const end=()=>{look={x:0,y:0};reset();};
 const preference=()=>{if(!canMove())end();};
 let observer=null;
 if(typeof IntersectionObserver==="function"){
  observer=new IntersectionObserver(entries=>{
   visible=Boolean(entries[0]?.isIntersecting);
   if(!visible)end();
  },{threshold:0});
  observer.observe(hero);
 }
 hero.addEventListener("pointermove",move,{passive:true});
 hero.addEventListener("pointerleave",end);
 window.addEventListener("delta:motionchange",preference);
 reduced.addEventListener?.("change",preference);
 coarse.addEventListener?.("change",preference);
 return {dispose(){
  if(disposed)return;disposed=true;observer?.disconnect();end();
  hero.removeEventListener("pointermove",move);
  hero.removeEventListener("pointerleave",end);
  window.removeEventListener("delta:motionchange",preference);
  reduced.removeEventListener?.("change",preference);
  coarse.removeEventListener?.("change",preference);
 }};
}
if(typeof document!=="undefined"&&typeof window!=="undefined"){
 const director=initArmoryDirector(document);
 window.addEventListener("pagehide",()=>director.dispose(),{once:true});
}
