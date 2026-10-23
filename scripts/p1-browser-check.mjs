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
 for(const config of [{name:"desktop",viewport:{width:1440,height:900},isMobile:false},{name:"mobile",viewport:{width:390,height:844},isMobile:true}]){
  const context=await browser.newContext({viewport:config.viewport,isMobile:config.isMobile,deviceScaleFactor:1,hasTouch:config.isMobile});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push("pageerror: "+e.message));
  page.on("console",m=>{if(m.type()==="error")errors.push("console: "+m.text().slice(0,300));});
  await page.goto("http://127.0.0.1:8734/",{waitUntil:"networkidle",timeout:40000});
  await page.locator("#recoil-summary").waitFor({state:"visible",timeout:14000});
  const result={mode:config.name,errors:[],nativeButtonVisible:false,glbStatus:null,loaded:false,canvasBounds:null,webgl2:false};
  await page.screenshot({path:resolve(out,config.name+"-2d.png"),fullPage:false});
  result.webgl2=await page.evaluate(()=>{
   const canvas=document.createElement("canvas");
   try{const gl=canvas.getContext("webgl2");if(!gl)return false;gl.getExtension("WEBGL_lose_context")?.loseContext();return true;}catch{return false;}
  });
  const native=page.getByRole("button",{name:"真實 AKM 3D"});
  await native.waitFor({state:"visible",timeout:12000});
  result.nativeButtonVisible=true;
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
     const rect=await canvas.boundingBox();result.canvasBounds=rect;
     await page.getByRole("button",{name:"查看網格"}).click();
     await page.getByRole("button",{name:"查看材質"}).click();
     await page.getByRole("button",{name:"重設視角"}).click();
     // Crop the interaction view to the actual 3D panel, not page top.
     await page.locator(".bench-canvas").scrollIntoViewIfNeeded();
     await page.screenshot({path:resolve(out,config.name+"-3d.png"),fullPage:false});
     await page.getByRole("button",{name:"2D 改槍"}).click();
     if(await page.locator(".local-glb-canvas").count())errors.push("Native viewer canvas not removed on exit");
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
