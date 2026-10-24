import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("AKM 2D render is a valid, lightweight local WebP",()=>{
 const file=readFileSync(new URL("../assets/akm-redraw-showcase.webp",import.meta.url));
 assert.equal(file.toString("ascii",0,4),"RIFF");
 assert.equal(file.toString("ascii",8,12),"WEBP");
 assert.ok(file.length>3000&&file.length<100_000);
});
test("illustration is visually separate from the editable SVG schematic",()=>{
 const gun=readFileSync(new URL("../src/gunsmith.mjs",import.meta.url),"utf8");
 const css=readFileSync(new URL("../assets/main.css",import.meta.url),"utf8");
 assert.match(gun,/akm-redraw-showcase\.webp/);
 assert.match(gun,/setArtPreview\(true\)/);
 assert.match(gun,/setArtPreview\(false\); \/\/ independent magazine/);
 assert.match(css,/\.bench-canvas\.is-art-preview \.bench-gun/);
 assert.match(css,/\.bench-canvas\.is-art-preview \.bench-magazine\{visibility:hidden\}/);
 assert.match(css,/\.bench-canvas\.is-model-preview \.bench-illustration/);
 assert.match(css,/\.bench-art-toggle:focus-visible/);
 assert.match(gun,/akm-magazine\.svg/);
});
