import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const html=file("../index.html"),css=file("../assets/main.css"),gun=file("../src/gunsmith.mjs");
const art=css.split("/* === ACFH V1.4")[1];
test("V1.4 uses one integrated art direction",()=>{
 assert.ok(art);
 assert.equal((css.match(/\/\* === ACFH V1/g)||[]).length,1);
 assert.match(html,/ACFH \/ V1\.4/);
 assert.match(html,/class="armory-experience"/);
 assert.match(art,/--arm-rail:262px/);
 assert.match(art,/\.bench-slot:before\{display:none\}/);
 assert.match(art,/url\("\.\/armory-environment\.svg"\)/);
});
test("hero, weapon stage and telemetry are one bounded experience",()=>{
 const start=html.indexOf('class="armory-experience"'),hero=html.indexOf('class="hero hero-editorial"'),
  weapon=html.indexOf('id="gunsmith-workbench"'),summary=html.indexOf('class="summary-grid"'),
  details=html.indexOf('class="panel details-panel"');
 assert.ok(start>=0&&start<hero&&hero<weapon&&weapon<summary&&summary<details);
 for(const id of ["gunsmith-workbench","recoil-summary","handling-summary","range-summary","velocity-summary","controls","stat-list","proof-verified","proof-provisional","research-directory"]){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
});
test("slot inspector is real interactive accessible DOM not fake visual labels",()=>{
 assert.match(gun,/node\("nav","bench-slot-rail"\)/);
 assert.match(gun,/rail\.setAttribute\("aria-label","AKM 配件部位導覽"\)/);
 assert.match(gun,/rail\.append\(button\)/);
 assert.match(gun,/button\.addEventListener\("click",\(\)=>open\(id\)\)/);
 assert.match(gun,/button\.setAttribute\("aria-pressed",String\(active===id\)\)/);
 assert.match(art,/\.bench-slot-rail\{/);
 assert.match(art,/\.bench-canvas\.is-model-preview \.bench-slot-rail\{display:none\}/);
 assert.match(art,/@media\(max-width:620px\)/);
 assert.doesNotMatch(art,/scaleX\(|scaleY\(/);
});
