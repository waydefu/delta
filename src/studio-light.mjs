/** Art-directed 2D WebGL2 studio light: not PBR, HDRI, or a real 3D material. */
import { shouldAnimate } from "./motion.mjs";
const VERT="#version 300 es\nlayout(location=0) in vec2 a_position;\nvoid main(){gl_Position=vec4(a_position,0.,1.);}";
const FRAG="#version 300 es\nprecision highp float;\nuniform vec2 u_resolution;\nuniform vec2 u_focus;\nuniform float u_activity;\nout vec4 fragColor;\nfloat noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\nvoid main(){vec2 uv=gl_FragCoord.xy/max(u_resolution,vec2(1.));vec2 p=(uv-vec2(.51,.52))*vec2(1.,1.35);float ambient=exp(-dot(p,p)*7.)*.035;vec2 q=(uv-u_focus)*vec2(1.12,1.6);float cue=exp(-dot(q,q)*19.)*u_activity*.045;float dark=smoothstep(.34,.75,length(p))*.017;float grain=(noise(floor(gl_FragCoord.xy*.65))-.5)*.006;vec3 rgb=vec3(.055,.075,.080)+ambient*vec3(.7,.85,.75)+cue*vec3(.7,.9,.77)-dark+grain;fragColor=vec4(clamp(rgb,vec3(0.),vec3(1.)),1.);}";
function compile(gl,type,src){
 const s=gl.createShader(type);if(!s)throw Error("shader unavailable");
 gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error("shader: "+e);}
 return s;
}
export function attachStudioLight(stage){
 const canvas=document.createElement("canvas");
 canvas.className="studio-light-canvas";canvas.setAttribute("aria-hidden","true");
 stage.querySelector(".bench-grid")?.after(canvas);
 let gl=null,program=null,buffer=null,loc=null,frame=0,token=0,inView=true,active=true;
 let observer=null,sizeObserver=null;
 const focus=[.5,.5];let activity=0;
 function init(){
  try{
   gl=canvas.getContext("webgl2",{alpha:true,antialias:false,depth:false,stencil:false,powerPreference:"low-power"});
   if(!gl){canvas.remove();return false;}
   const vs=compile(gl,gl.VERTEX_SHADER,VERT),fs=compile(gl,gl.FRAGMENT_SHADER,FRAG);
   program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
   gl.deleteShader(vs);gl.deleteShader(fs);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("link: "+gl.getProgramInfoLog(program));
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   loc={resolution:gl.getUniformLocation(program,"u_resolution"),focus:gl.getUniformLocation(program,"u_focus"),activity:gl.getUniformLocation(program,"u_activity")};
   return true;
  }catch(error){console.warn("Optional WebGL light disabled:",error);gl=null;program=null;canvas.remove();return false;}
 }
 function draw(){
  if(!gl||!program||!inView||document.visibilityState==="hidden")return;
  gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);
  gl.uniform2f(loc.resolution,canvas.width,canvas.height);
  gl.uniform2f(loc.focus,focus[0],1-focus[1]);
  gl.uniform1f(loc.activity,shouldAnimate()?activity:0);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.drawArrays(gl.TRIANGLES,0,3);
 }
 function resize(){
  if(!gl)return;
  const rect=stage.getBoundingClientRect();
  if(rect.width<1||rect.height<1)return;
  const mobile=window.matchMedia?.("(max-width:760px)")?.matches??false;
  const ratio=Math.min(window.devicePixelRatio||1,mobile?1:1.25);
  canvas.width=Math.min(1360,Math.max(1,Math.round(rect.width*ratio)));
  canvas.height=Math.min(740,Math.max(1,Math.round(rect.height*ratio)));
  draw();
 }
 function cancel(){token++;if(frame)cancelAnimationFrame(frame);frame=0;activity=0;}
 function cueAt(x,y){
  if(!gl||!shouldAnimate())return;
  cancel();const current=token,start=performance.now();
  const from=focus.slice();
  const to=[Math.max(.04,Math.min(.96,x)),Math.max(.04,Math.min(.96,y))];
  function tick(now){
   if(current!==token)return;
   const t=Math.min(1,(now-start)/360),e=1-Math.pow(1-t,3);
   focus[0]=from[0]+(to[0]-from[0])*e;focus[1]=from[1]+(to[1]-from[1])*e;
   activity=Math.sin(Math.PI*t)*.65;draw();
   if(t<1)frame=requestAnimationFrame(tick);else{frame=0;activity=0;draw();}
  }
  frame=requestAnimationFrame(tick);
 }
 canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();cancel();gl=null;});
 canvas.addEventListener("webglcontextrestored",()=>{if(active&&init())resize();});
 if(init()){
  if(typeof ResizeObserver!=="undefined"){sizeObserver=new ResizeObserver(resize);sizeObserver.observe(stage);}
  else window.addEventListener("resize",resize,{passive:true});
  if(typeof IntersectionObserver!=="undefined"){
   observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;if(!inView)cancel();else resize();});
   observer.observe(stage);
  }
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancel();else resize();});
  resize();
 }
 return {cueAt,resize,get active(){return Boolean(gl);},destroy(){active=false;cancel();observer?.disconnect();sizeObserver?.disconnect();if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);}canvas.remove();gl=null;}};
}
