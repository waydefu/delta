/** Browser regression for the 2D AKM workbench, independent of the 3D viewer. */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {chromium} from "playwright";

const root=process.cwd(),output=resolve(root,"browser-evidence");
await mkdir(output,{recursive:true});
const types={".html":"text/html;charset=utf-8",".mjs":"text/javascript;charset=utf-8",".js":"text/javascript;charset=utf-8",".json":"application/json",".css":"text/css",".svg":"image/svg+xml",".glb":"model/gltf-binary"};
const server=createServer(async(request,response)=>{
 try {
  const uri=new URL(request.url,"http://127.0.0.1");
  const pathname=decodeURIComponent(uri.pathname);
  const file=resolve(root,"."+pathname+(pathname.endsWith("/")?"index.html":""));
  if(!file.startsWith(root+sep)){response.writeHead(403).end();return;}
  const body=await readFile(file);
  response.writeHead(200,{"content-type":types[extname(file)]||"application/octet-stream","cache-control":"no-store"}).end(body);
 }catch{response.writeHead(404).end("Not found");}
});
await new Promise(ready=>server.listen(8765,"127.0.0.1",ready));
let browser;
const result={testedAt:new Date().toISOString(),cases:[]},failures=[];
try{
 browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 const cases=[
  {name:"desktop",width:1440,height:900,mobile:false},
  {name:"mobile-390",width:390,height:844,mobile:true},
  {name:"mobile-360",width:360,height:800,mobile:true},
  {name:"reduced-motion",width:1440,height:900,mobile:false,reduced:true},
  {name:"no-webgl",width:1440,height:900,mobile:false,denyWebgl:true}
 ];
 for(const config of cases){
  const record={name:config.name,errors:[],lazyCanvas:false,drawerWorks:false,restoresFocus:false,noEager3D:false};
  let context;
  try{
   context=await browser.newContext({
    viewport:{width:config.width,height:config.height},
    isMobile:config.mobile,hasTouch:config.mobile,deviceScaleFactor:1,
    reducedMotion:config.reduced?"reduce":"no-preference"
   });
   if(config.denyWebgl){
    await context.addInitScript(()=>{
     const original=HTMLCanvasElement.prototype.getContext;
     HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(type==="webgl2")return null;
      return original.call(this,type,...args);
     };
    });
   }
   const page=await context.newPage(),requests=[];
   page.on("pageerror",err=>record.errors.push("Runtime: "+err.message));
   page.on("request",req=>requests.push(req.url()));
   await page.goto("http://127.0.0.1:8765/",{waitUntil:"networkidle",timeout:40000});
   await page.locator("#recoil-summary").waitFor({state:"visible",timeout:12000});
   await page.locator(".bench-canvas").scrollIntoViewIfNeeded();
   await page.waitForTimeout(150);
   const background=await page.locator(".bench-canvas").evaluate(el=>getComputedStyle(el).backgroundImage);
   assert.match(background,/armory-environment\.svg/,"ACFH 2D armory scene not applied");
   const environmentLoaded=await page.evaluate(async()=> (await fetch("./assets/armory-environment.svg")).ok);
   assert.equal(environmentLoaded,true,"Local cinematic backdrop failed to load");
   const editorial=await page.evaluate(()=>{
    const summary=document.querySelector(".summary-card");
    const config=document.querySelector(".workspace .configuration");
    const slot=document.querySelector(".bench-slot");
    const color=el=>getComputedStyle(el).backgroundColor;
    const trans=c=>c==="rgba(0, 0, 0, 0)"||c==="transparent";
    return {summary:trans(color(summary)),config:trans(color(config)),
     chapter:document.querySelector(".summary-grid").compareDocumentPosition(document.querySelector(".details-panel"))&Node.DOCUMENT_POSITION_FOLLOWING,
     slotBorder:getComputedStyle(slot).borderTopWidth,
     slotHeight:Math.round(slot.getBoundingClientRect().height)};
   });
   assert.ok(editorial.summary&&editorial.config&&editorial.chapter,"Editorial surfaces/order regressed");
   if(!config.mobile)assert.equal(editorial.slotBorder,"0px","Desktop callout should be label, not boxed card");
   if(config.mobile)assert.ok(editorial.slotHeight>=44,"Mobile slot touch target too small");
   assert.equal(await page.locator(".studio-light-canvas").count(),0,"GPU canvas allocated before interaction");
   record.lazyCanvas=true;
   assert.equal(await page.locator(".bench-slot-rail .bench-slot").count(),11,"Lost an AKM attachment channel");
   const boxes=await page.evaluate(()=>{
    const rect=selector=>{
     const r=document.querySelector(selector)?.getBoundingClientRect();
     return r?{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null;
    };
    const s=rect(".bench-canvas"),rifle=rect(".bench-gun"),rail=rect(".bench-slot-rail");
    return {s,rifle,rail,overflow:document.documentElement.scrollWidth-innerWidth};
   });
   assert.ok(boxes.s&&boxes.rifle&&boxes.rail,"Integrated stage element missing");
   if(config.mobile){
    assert.ok(boxes.rail.y>=boxes.rifle.bottom-5,"Mobile slots overlap the weapon image");
    assert.ok(boxes.overflow<=2,"Unexpected horizontal page overflow on mobile");
   }else{
    assert.ok(boxes.rifle.right<=boxes.rail.x+5,"Desktop inspector obscures rifle");
   }
   await page.screenshot({path:resolve(output,"2d-"+config.name+".png"),fullPage:false});
   if(config.name==="desktop"||config.name==="mobile-390")
    await page.screenshot({path:resolve(output,"2d-"+config.name+"-full.png"),fullPage:true});
   const trigger=page.locator(".bench-slot").first();
   await trigger.focus();
   await page.keyboard.press("ArrowDown");
   const focused=await page.locator(".bench-slot").nth(1).evaluate(el=>document.activeElement===el);
   assert.equal(focused,true,"Inspector arrow navigation failed");
   await trigger.click();
   const drawer=page.locator(".bench-drawer");
   await drawer.waitFor({state:"visible"});
   assert.equal(await drawer.locator(".drawer-close").count(),1,"Missing drawer close button");
   record.drawerWorks=true;
   if(config.mobile||config.reduced||config.denyWebgl)
    assert.equal(await page.locator(".studio-light-canvas").count(),0,"Disabled mode allocated GPU canvas");
   await page.keyboard.press("Escape");
   await drawer.waitFor({state:"hidden",timeout:6000});
   record.restoresFocus=await trigger.evaluate(element=>document.activeElement===element);
   assert.equal(record.restoresFocus,true,"Drawer must restore focus to selected slot");
   if(config.name==="desktop"){
    await page.getByRole("button",{name:"切換介面動效"}).click();
    assert.equal(await page.locator(".studio-light-canvas").count(),0,"Motion off did not release GPU");
   }
   record.noEager3D=!requests.some(uri=>/\/(?:three(?:\.module)?\.js|models\/.*\.glb)(?:\?|$)/.test(uri));
   assert.equal(record.noEager3D,true,"2D initial view downloaded 3D model/renderer");
  }catch(error){
   record.errors.push(error.message);
   failures.push(config.name+": "+error.message);
  }finally{
   result.cases.push(record);
   await context?.close();
  }
 }
}finally{
 await browser?.close();server.close();
 await writeFile(resolve(output,"2d-report.json"),JSON.stringify(result,null,2));
}
console.log("P2_2D_BROWSER_REPORT",JSON.stringify(result));
if(failures.length){console.error(failures.join("\n"));process.exitCode=1;}
