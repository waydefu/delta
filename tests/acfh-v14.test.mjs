import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=file=>readFileSync(new URL(file,import.meta.url),"utf8");
const html=read("../index.html"),gun=read("../src/gunsmith.mjs"),app=read("../src/app.mjs"),css=read("../assets/main.css");
test("One live source: metrics are left of the weapon in a shared workbench",()=>{
 const workbench=html.indexOf('class="armory-workbench-layout"');
 const metrics=html.indexOf('class="panel metrics armory-metrics"');
 const rifle=html.indexOf('id="gunsmith"');
 const summary=html.indexOf('class="summary-grid"');
 assert.ok(workbench>=0&&metrics>workbench&&rifle>metrics&&summary>rifle);
 assert.equal((html.match(/id="stat-list"/g)||[]).length,1);
 assert.equal((html.match(/class="panel metrics/g)||[]).length,1);
 assert.match(css,/\.armory-workbench-layout\{\s*display:grid;grid-template-columns:/);
 assert.match(app,/setText\("metrics-current-part",recentPart/);
});
test("Installed part names replace the generic installed status",()=>{
 assert.match(gun,/status\.textContent=installed\?installed\.name/);
 assert.doesNotMatch(gun,/status\.textContent=installed\?"已安裝"/);
 assert.match(gun,/button\.setAttribute\("aria-label",installed\?label/);
});
test("Redrawn vector retains separated components and shared coordinates",()=>{
 const svg=read("../assets/akm-side.svg");
 const magazine=read("../assets/akm-magazine.svg");
 for(const asset of [svg,magazine])assert.match(asset,/viewBox="0 0 1000 420"/);
 for(const id of ["front-assembly","receiver-assembly","stock-assembly","woodFiber","steelBrushing"]){
  assert.ok(svg.includes('id="'+id+'"'),id);
 }
 assert.ok(svg.includes("curved removable top cover"));
 assert.ok(svg.includes("pistol grip: narrowed profile"));
 assert.doesNotMatch(svg,/<script|<foreignObject/i);
 assert.ok(svg.length>8500,"Detailed editable vector source required");
});
