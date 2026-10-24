/** 2D studio accent light: optional, input-triggered, never required for AKM UI. */
import {shouldAnimate} from "./motion.mjs";

const VERT="#version 300 es\nlayout(location=0) in vec2 a_position;\nvoid main(){gl_Position=vec4(a_position,0.,1.);}";
const FRAG="#version 300 es\nprecision highp float;\nuniform vec2 u_resolution;\nuniform vec2 u_focus;\nuniform float u_activity;\nout vec4 fragColor;\nfloat noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\nvoid main(){vec2 uv=gl_FragCoord.xy/max(u_resolution,vec2(1.));vec2 p=(uv-vec2(.51,.52))*vec2(1.,1.35);float ambient=exp(-dot(p,p)*7.)*.035;vec2 q=(uv-u_focus)*vec2(1.12,1.6);float cue=exp(-dot(q,q)*19.)*u_activity*.045;float dark=smoothstep(.34,.75,length(p))*.017;float grain=(noise(floor(gl_FragCoord.xy*.65))-.5)*.006;vec3 rgb=vec3(.055,.075,.080)+ambient*vec3(.7,.85,.75)+cue*vec3(.7,.9,.77)-dark+grain;fragColor=vec4(clamp(rgb,vec3(0.),vec3(1.)),1.);}";
function compile(gl,type,src){
 const shader=gl.createShader(type);
 if(!shader)throw new Error("WebGL shader unavailable");
 gl.shaderSource(shader,src);gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
  const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);
  throw new Error("Shader: "+message);
 }
 return shader;
}

/** Pure, testable eligibility; reduced motion and narrow screens never allocate GPU. */
export function canUseStudioLight({motion,wide,visible,foreground}){
 return Boolean(motion&&wide&&visible&&foreground);
}
export function attachStudioLight(stage){
 const narrow=window.matchMedia?.("(max-width:760px)");
 const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
 let canvas=null,gl=null,program=null,buffer=null,loc=null,frame=0,token=0;
 let inView=true,disposed=false;
 const focus=[.5,.5];let activity=0;
 stage.dataset.studioLight="idle";

 const allowed=()=>!disposed&&canUseStudioLight({
  motion:shouldAnimate(),wide:!narrow?.matches,visible:inView,foreground:!document.hidden
 });
 function cancel(){
  token++;
  if(frame)cancelAnimationFrame(frame);
  frame=0;activity=0;
 }
 function release(){
  cancel();
  const previous=gl;
  gl=null;program=null;buffer=null;loc=null;
  if(previous){
   try{
    if(buffer)previous.deleteBuffer(buffer);
    if(program)previous.deleteProgram(program);
    previous.getExtension("WEBGL_lose_context")?.loseContext();
   }catch{ /* context may already be lost */ }
  }
  if(canvas)canvas.remove();
  canvas=null;
  stage.dataset.studioLight="idle";
 }
 function draw(){
  if(!gl||!program||!allowed()||!canvas)return;
  gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
  gl.uniform2f(loc.resolution,canvas.width,canvas.height);
  gl.uniform2f(loc.focus,focus[0],1-focus[1]);
  gl.uniform1f(loc.activity,activity);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.drawArrays(gl.TRIANGLES,0,3);
 }
 function resize(){
  if(!gl||!canvas||!allowed())return;
  const box=stage.getBoundingClientRect();
  if(box.width<1||box.height<1)return;
  const ratio=Math.min(window.devicePixelRatio||1,1.25);
  const width=Math.min(1360,Math.max(1,Math.round(box.width*ratio)));
  const height=Math.min(740,Math.max(1,Math.round(box.height*ratio)));
  if(canvas.width!==width||canvas.height!==height){
   canvas.width=width;canvas.height=height;
   draw();
  }
 }
 function init(){
  if(gl)return true;
  if(!allowed())return false;
  const element=document.createElement("canvas");
  element.className="studio-light-canvas";
  element.setAttribute("aria-hidden","true");
  stage.querySelector(".bench-grid")?.after(element);
  canvas=element;
  element.addEventListener("webglcontextlost",event=>{
   event.preventDefault();
   if(canvas!==element)return;
   cancel();gl=null;program=null;buffer=null;loc=null;
   canvas.remove();canvas=null;stage.dataset.studioLight="idle";
  });
  try{
   const context=element.getContext("webgl2",{
    alpha:true,antialias:false,depth:false,stencil:false,powerPreference:"low-power"
   });
   if(!context){release();return false;}
   gl=context;
   const vs=compile(gl,gl.VERTEX_SHADER,VERT),fs=compile(gl,gl.FRAGMENT_SHADER,FRAG);
   program=gl.createProgram();
   if(!program)throw new Error("WebGL program unavailable");
   gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
   gl.deleteShader(vs);gl.deleteShader(fs);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
   buffer=gl.createBuffer();
   if(!buffer)throw new Error("WebGL buffer unavailable");
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   loc={resolution:gl.getUniformLocation(program,"u_resolution"),focus:gl.getUniformLocation(program,"u_focus"),activity:gl.getUniformLocation(program,"u_activity")};
   stage.dataset.studioLight="active";
   resize();draw();return true;
  }catch(error){
   console.warn("Optional studio light disabled; CSS backdrop retained",error);
   release();return false;
  }
 }
 function cueAt(x,y){
  if(!allowed()){if(gl)release();return;}
  if(!init())return;
  cancel();
  const current=token,start=performance.now(),from=focus.slice();
  const to=[Math.max(.04,Math.min(.96,x)),Math.max(.04,Math.min(.96,y))];
  function tick(now){
   if(current!==token||!allowed()){cancel();return;}
   const t=Math.min(1,(now-start)/360),ease=1-Math.pow(1-t,3);
   focus[0]=from[0]+(to[0]-from[0])*ease;
   focus[1]=from[1]+(to[1]-from[1])*ease;
   activity=Math.sin(Math.PI*t)*.65;draw();
   if(t<1)frame=requestAnimationFrame(tick);
   else{frame=0;activity=0;draw();}
  }
  frame=requestAnimationFrame(tick);
 }
 const observer=typeof IntersectionObserver==="function"?new IntersectionObserver(entries=>{
  inView=entries[0]?.isIntersecting??true;
  if(!inView)release();
 }):null;
 observer?.observe(stage);
 const sizes=typeof ResizeObserver==="function"?new ResizeObserver(resize):null;
 sizes?.observe(stage);
 const onVisibility=()=>{if(document.hidden)release();};
 const onPreference=()=>{if(!allowed())release();};
 document.addEventListener("visibilitychange",onVisibility);
 window.addEventListener("delta:motionchange",onPreference);
 narrow?.addEventListener?.("change",onPreference);
 reduced?.addEventListener?.("change",onPreference);
 return {
  cueAt,resize,
  get active(){return Boolean(gl);},
  destroy(){
   if(disposed)return;
   disposed=true;release();
   observer?.disconnect();sizes?.disconnect();
   document.removeEventListener("visibilitychange",onVisibility);
   window.removeEventListener("delta:motionchange",onPreference);
   narrow?.removeEventListener?.("change",onPreference);
   reduced?.removeEventListener?.("change",onPreference);
  }
 };
}
