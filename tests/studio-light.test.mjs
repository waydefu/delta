import test from "node:test";
import assert from "node:assert/strict";
import {canUseStudioLight,attachStudioLight} from "../src/studio-light.mjs";
import {setMotionPreference} from "../src/motion.mjs";

test("light eligibility is fail-closed across motion, narrow, visibility and background",()=>{
 const baseline={motion:true,wide:true,visible:true,foreground:true};
 assert.equal(canUseStudioLight(baseline),true);
 for(const field of Object.keys(baseline))
  assert.equal(canUseStudioLight({...baseline,[field]:false}),false,field);
});
function fakeDom({narrow=false,context=true}={}){
 const originals=Object.fromEntries(["window","document","matchMedia","IntersectionObserver","ResizeObserver","requestAnimationFrame","cancelAnimationFrame","performance"].map(key=>[key,globalThis[key]]));
 const state={canvases:0,removed:0,contexts:0,deleted:0,lost:0,draws:0,queued:0};
 const w=new EventTarget(),doc=new EventTarget();
 const queries=new Map();
 w.matchMedia=query=>{
  if(!queries.has(query)){
   const media=new EventTarget();
   media.matches=query.includes("max-width")?narrow:false;
   queries.set(query,media);
  }
  return queries.get(query);
 };
 w.devicePixelRatio=1;
 const gl={
  VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,LINK_STATUS:35714,ARRAY_BUFFER:34962,STATIC_DRAW:35044,FLOAT:5126,TRIANGLES:4,
  createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,getShaderInfoLog:()=>"",
  deleteShader(){},createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,getProgramInfoLog:()=>"",
  createBuffer:()=>({}),bindBuffer(){},bufferData(){},enableVertexAttribArray(){},vertexAttribPointer(){},
  getUniformLocation:()=>({}),viewport(){},useProgram(){},uniform2f(){},uniform1f(){},
  drawArrays(){state.draws++},deleteProgram(){state.deleted++},deleteBuffer(){state.deleted++},
  getExtension:()=>({loseContext(){state.lost++}})
 };
 doc.hidden=false;
 doc.createElement=()=>{
  state.canvases++;
  return {className:"",width:300,height:150,setAttribute(){},addEventListener(){},
   getContext(){state.contexts++;return context?gl:null},
   remove(){state.removed++}};
 };
 globalThis.window=w;globalThis.document=doc;
 globalThis.matchMedia=w.matchMedia;
 globalThis.IntersectionObserver=undefined;
 globalThis.ResizeObserver=undefined;
 globalThis.performance={now:()=>0};
 globalThis.requestAnimationFrame=()=>++state.queued;
 globalThis.cancelAnimationFrame=()=>{};
 const stage={dataset:{},querySelector:()=>({after(){}}),getBoundingClientRect:()=>({width:1100,height:530})};
 return {stage,state,w,doc,queries,restore(){
  for(const [key,value] of Object.entries(originals)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
  setMotionPreference("system");
 }};
}
test("desktop never allocates a GPU context before user interaction",()=>{
 const m=fakeDom();try{
  setMotionPreference("system");
  const light=attachStudioLight(m.stage);
  assert.equal(m.state.canvases,0);
  assert.equal(m.state.contexts,0);
  light.cueAt(.5,.5);
  assert.equal(m.state.canvases,1);
  assert.equal(m.state.contexts,1);
  assert.equal(light.active,true);
  light.destroy();
  assert.equal(m.state.deleted,2);
  assert.equal(m.state.lost,1);
  assert.equal(m.state.removed,1);
 }finally{m.restore();}
});
test("narrow mobile screens never allocate WebGL",()=>{
 const m=fakeDom({narrow:true});
 try{
  const light=attachStudioLight(m.stage);
  light.cueAt(.5,.5);
  assert.equal(m.state.canvases,0);
  light.destroy();
 }finally{m.restore();}
});
test("motion opt-out releases GPU and subsequent cues use static fallback",()=>{
 const m=fakeDom();
 try{
  setMotionPreference("system");
  const light=attachStudioLight(m.stage);
  light.cueAt(.5,.5);
  setMotionPreference("off");
  m.w.dispatchEvent(new Event("delta:motionchange"));
  assert.equal(light.active,false);
  assert.equal(m.state.lost,1);
  light.cueAt(.3,.4);
  assert.equal(m.state.canvases,1);
  light.destroy();
 }finally{m.restore();}
});
test("context unavailable leaves core 2D UI and teardown functional",()=>{
 const m=fakeDom({context:false});
 try{
  const light=attachStudioLight(m.stage);
  light.cueAt(.5,.5);
  assert.equal(light.active,false);
  assert.equal(m.state.removed,1);
  light.destroy();
 }finally{m.restore();}
});
