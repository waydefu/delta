/* Real Chromium smoke check for the static AKM site, with WebGL-safe reporting. */
import {createServer} from "node:http";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {chromium} from "playwright";
const root=process.cwd(), out=resolve(root,"browser-evidence");
await mkdir(out,{recursive:true});
const types={".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",".mjs":"text/javascript;charset=utf-8",".json":"application/json",".css":"text/css",".svg":"image/svg+xml",".glb":"model/gltf-binary"};
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 const full=resolve(root,"."+pathname+(pathname.endsWith("/")?"index.html":""));
 if(!full.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{
  const body=await readFile(full);res.writeHead(200,{"content-type":types[extname(full)]||"application/octet-stream","cache-control":"no-store"}).end(body);
 }catch{res.writeHead(404).end("Not found");}
});
await new Promise(r=>server.listen(8734,"127.0.0.1",r));
const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const report={at:new Date().toISOString(),browsers:[],asset:"assets/models/akm.glb",notes:[]};
let failed=false;
try{
 for(const config of [
 {name:"desktop",viewport:{width:1440,height:900},isMobile:false},
 {name:"mobile",viewport:{width:390,height:844},isMobile:true},
 {name:"draft-parts",viewport:{width:1440,height:900},isMobile:false,draft:true}
]){
  const context=await browser.newContext({viewport:config.viewport,isMobile:config.isMobile,deviceScaleFactor:1,hasTouch:config.isMobile});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push("pageerror: "+e.message));
  page.on("console",m=>{if(m.type()==="error")errors.push("console: "+m.text().slice(0,300));});
  await page.goto("http://127.0.0.1:8734/"+(config.draft?"?partReview=1":""),{waitUntil:"networkidle",timeout:40000});
  await page.locator("#recoil-summary").waitFor({state:"visible",timeout:14000});
  const result={mode:config.name,errors:[],nativeButtonVisible:false,glbStatus:null,loaded:false,canvasBounds:null,webgl2:false};
  await page.screenshot({path:resolve(out,config.name+"-2d.png"),fullPage:false});
  result.webgl2=await page.evaluate(()=>{
   const canvas=document.createElement("canvas");
   try{const gl=canvas.getContext("webgl2");if(!gl)return false;gl.getExtension("WEBGL_lose_context")?.loseContext();return true;}catch{return false;}
  });
  const native=page.getByRole("button",{name:config.draft?"分件測試 3D":"真實 AKM 3D"});
  await native.waitFor({state:"visible",timeout:12000});
  result.nativeButtonVisible=true;
  if(config.name==="desktop"){
   const stock=page.locator('.bench-slot[data-slot="stock"]');
   await stock.click();
   const drawer=page.locator(".bench-drawer");
   await drawer.waitFor({state:"visible"});
   await drawer.getByRole("searchbox",{name:"搜尋槍托配件"}).fill("PT1 特種槍托");
   await drawer.locator(".bench-option:visible").click();
   await drawer.waitFor({state:"hidden"});
  }
  if(result.webgl2){
   await native.click();
   try{
    await page.waitForFunction(()=>{
     const p=document.querySelector(".local-glb-status");
     return p && (/載入完成|無法載入/.test(p.textContent));
    },{timeout:35000});
    result.glbStatus=await page.locator(".local-glb-status").textContent();
    result.loaded=result.glbStatus.includes("載入完成");
    const canvas=page.locator(".local-glb-canvas");
    if(result.loaded){
     if(!result.glbStatus.includes("2 個網格"))errors.push("Expected the visually reviewed body and magazine two-node model");
     const rect=await canvas.boundingBox();result.canvasBounds=rect;
     if(!rect||rect.width<260||rect.height<220)
       errors.push("3D viewport is collapsed or too small in "+config.name+" mode");
     await page.getByRole("button",{name:"查看網格"}).click();
     await page.getByRole("button",{name:"查看材質"}).click();
     // ACFH 2.2: mesh inspection shows actual GLB topology, never inferred gun accessories.
     const inspectModel=page.getByRole("button",{name:"檢查 3D 分件"});
     await inspectModel.click();
     const auditPanel=page.locator(".local-geometry-audit");
     await auditPanel.waitFor({state:"visible"});
     const auditText=await auditPanel.innerText();
     if(!auditText.includes("網格：2")||!auditText.includes("材質：1")||
        !auditText.includes("槍口：未分件")||!auditText.includes("槍托：未分件")||
        !auditText.includes("可真正替換的配件型號：0"))
      errors.push("False geometry coverage claim: "+auditText.slice(0,300));
     await inspectModel.click();
     await auditPanel.waitFor({state:"hidden"});
     const meshOnly=page.getByRole("button",{name:"單看彈匣幾何"});
     if(!(await meshOnly.isVisible()))errors.push("Reviewed independent magazine inspect action missing");
     else{
      await meshOnly.click();
      if(await canvas.getAttribute("data-mesh-isolation")!=="magazine")
       errors.push("Actual independent magazine isolation not applied");
      const restore=page.getByRole("button",{name:"還原全槍幾何"});
      await restore.click();
      if(await canvas.getAttribute("data-mesh-isolation")!=="none")
       errors.push("Complete body geometry not restored");
      else result.verifiedGeometryIsolation=true;
     }
     result.modelTopologyAuditVisible=true;
     // ACFH 2.1: real Three.js light presets, never CSS-only recoloring.
     for(const [label,mode] of [["材質比對","neutral"],["細節檢視","inspection"],["電影光影","cinematic"]]){
      const preset=page.getByRole("button",{name:label});
      await preset.click();
      if(await preset.getAttribute("aria-pressed")!=="true")errors.push("Lighting button not pressed: "+label);
      const actual=await canvas.getAttribute("data-lighting-preset");
      if(actual!==mode)errors.push("Three.js scene did not switch to "+mode+": "+actual);
     }
     const partFocus=page.getByRole("button",{name:"聚焦彈匣"});
     if(!(await partFocus.isVisible()))errors.push("Independent magazine focus button missing");
     else{
      await partFocus.click();
      await page.waitForFunction(()=>
       document.querySelector(".local-glb-canvas")?.dataset?.cameraFocus==="magazine",null,{timeout:7000});
      await page.waitForFunction(()=>
       document.querySelector(".local-glb-canvas")?.dataset?.cameraMoving==="false",null,{timeout:7000});
      result.magazineCameraFocus=true;
     }
     await page.getByRole("button",{name:"重設視角"}).click();
     await page.waitForFunction(()=>
       document.querySelector(".local-glb-canvas")?.dataset?.cameraFocus==="overview",null,{timeout:7000});
     result.lightPresetsVerified=true;
     if(config.name==="desktop"){
      const configText=await page.locator(".local-viewer-configuration").innerText();
      if(!configText.includes("PT1 特種槍托")||!configText.includes("3D 模型未隨配件更換"))
       errors.push("3D build annotation lost selection truthfulness: "+configText);
      else result.researchBuildHudVerified=true;
     }
     const animate=page.getByRole("button",{name:"3D 彈匣裝卸示範"});
     await animate.click();
     await page.waitForFunction(()=>{
       const canvas=document.querySelector(".local-glb-canvas");
       return Number(canvas?.dataset?.magazineMaxDisplacement||0)>0.03;
     },null,{timeout:6000});
     result.magazinePeakDisplacement=Number(await canvas.getAttribute("data-magazine-max-displacement"));
     await page.screenshot({path:resolve(out,config.name+"-magazine-moving.png"),fullPage:false});
     await animate.waitFor({state:"visible",timeout:6000});
     await page.waitForFunction(()=>!document.querySelector(".local-viewer-toolbar button[disabled]"),null,{timeout:6000});
     result.magazineFinalDisplacement=Number(await canvas.getAttribute("data-magazine-displacement"));
     if(result.magazinePeakDisplacement<=.03||result.magazineFinalDisplacement>.0001)
       errors.push("Magazine animation failed motion/return integrity check");
     if(config.draft){
       if(!result.glbStatus.includes("2 個網格"))errors.push("Expected two independently separated meshes");
       await page.getByRole("button",{name:"隱藏候選彈匣"}).click();
       await page.locator(".bench-canvas").scrollIntoViewIfNeeded();
       await page.screenshot({path:resolve(out,"draft-mag-hidden.png"),fullPage:false});
       await page.getByRole("button",{name:"顯示候選彈匣"}).click();
     }
     // Crop the interaction view to the actual 3D panel, not page top.
     await page.locator(".bench-canvas").scrollIntoViewIfNeeded();
     await page.screenshot({path:resolve(out,config.name+"-3d.png"),fullPage:false});
     await page.getByRole("button",{name:"2D 改槍"}).click();
     if(await page.locator(".local-glb-canvas").count())errors.push("Native viewer canvas not removed on exit");
     if(!(await page.locator(".bench-slot-rail").isVisible()))
       errors.push("2D attachment inspector did not return after exiting 3D");
    }
   }catch(e){errors.push("native GLB: "+e.message.slice(0,300));}
  }else report.notes.push(config.name+" runner Chromium has no usable WebGL2; native scene execution untestable here");
  result.errors=errors;
  if(errors.length||(result.webgl2&&!result.loaded))failed=true;
  report.browsers.push(result);
  await context.close();
 }
}finally{
 await browser.close();server.close();
 await writeFile(resolve(out,"report.json"),JSON.stringify(report,null,2));
}
console.log("P1_REAL_BROWSER_REPORT",JSON.stringify(report));
if(failed)process.exitCode=1;
