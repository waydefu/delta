import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../assets/main.css",import.meta.url),"utf8");
const editorial=css.split("/* === ACFH V1.2")[1];
test("ACFH v1.2 replaces old art direction rather than stacking visual versions",()=>{
 assert.ok(editorial);
 assert.equal((css.match(/\/\* === ACFH V1/g)||[]).length,1);
 assert.match(html,/ACFH \/ V1\.2/);
 assert.match(editorial,/--acfh-rule/);
 assert.match(editorial,/\.summary-card:before\{display:none\}/);
 assert.match(editorial,/\.bench-slot:before\{display:none\}/);
});
test("weapon and researched data remain connected and unchanged",()=>{
 for(const id of ["gunsmith-workbench","recoil-summary","handling-summary","range-summary","velocity-summary","controls","stat-list","proof-verified","proof-provisional","research-directory"]){
  assert.match(html,new RegExp('id="'+id+'"'),id);
 }
 assert.ok(html.indexOf('class="summary-grid"')<html.indexOf('class="panel details-panel"'));
 assert.match(editorial,/url\("\.\/armory-environment\.svg"\)/);
 assert.match(editorial,/@media\(max-width:620px\)/);
 assert.doesNotMatch(editorial,/scaleX\(|scaleY\(/);
});