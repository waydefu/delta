import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {cinematicMotionAllowed,normalizedLook} from "../src/armory-director.mjs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const html=read("../index.html");
const css=read("../assets/main.css");
const director=read("../src/armory-director.mjs");

test("ACFH 2.0 opens with a layered local cinematic scene, not eager 3D or remote media",()=>{
 assert.match(html,/ACFH \/ 2\.0/);
 assert.match(html,/class="hero-cinema"/);
 assert.match(html,/class="hero-cinema-environment"/);
 assert.match(html,/class="hero-cinema-weapon"/);
 assert.match(html,/class="hero-cinema-beam"/);
 assert.match(html,/class="hero-cinema-floor"/);
 assert.match(html,/\.\/assets\/akm-redraw-showcase\.webp/);
 assert.match(html,/\.\/src\/armory-director\.mjs/);
 assert.ok(html.indexOf("src/armory-director.mjs")<html.indexOf("src/app.mjs"));
 assert.match(html,/href="#gunsmith"/);
 assert.match(html,/href="#detail-explorer"/);
 assert.match(html,/RESEARCH MODE/);
 assert.doesNotMatch(director,/import\s*.*three|new\s+WebGLRenderer|new\s+WebGL2RenderingContext/);
});
test("scene direction is bounded and automatically disabled for touch, reduced motion, or motion-off",()=>{
 assert.deepEqual(normalizedLook(0,0,{left:0,top:0,width:100,height:100}),{x:-1,y:-1});
 assert.deepEqual(normalizedLook(50,50,{left:0,top:0,width:100,height:100}),{x:0,y:0});
 assert.deepEqual(normalizedLook(500,500,{left:0,top:0,width:100,height:100}),{x:1,y:1});
 assert.deepEqual(normalizedLook(1,1,{left:0,top:0,width:0,height:0}),{x:0,y:0});
 assert.equal(cinematicMotionAllowed({reduced:false,coarse:false,enabled:true}),true);
 for(const p of [{reduced:true,coarse:false,enabled:true},{reduced:false,coarse:true,enabled:true},
  {reduced:false,coarse:false,enabled:false},{reduced:false,coarse:false,enabled:true,visible:false}]){
  assert.equal(cinematicMotionAllowed(p),false);
 }
 assert.match(director,/requestAnimationFrame\(paint\)/);
 assert.match(director,/pagehide/);
 assert.match(director,/delta:motionchange/);
 assert.match(director,/IntersectionObserver/);
});
test("cinema styling preserves viewport accessibility, original workbench and reduced-motion fallback",()=>{
 assert.match(css,/\.hero\.hero-editorial\{/);
 assert.match(css,/\.hero-cinema-weapon/);
 assert.match(css,/\.hero-cinema-floor/);
 assert.match(css,/\.hero-cinema-beam/);
 assert.match(css,/\.hero-secondary-action:focus-visible/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.bench-canvas\.is-model-preview/);
 assert.match(css,/\.bench-canvas\.is-art-preview/);
 assert.match(html,/id="gunsmith-workbench"/);
 assert.match(html,/id="stat-list"/);
 assert.match(html,/id="detail-explorer"/);
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
});
