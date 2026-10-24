import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
test("ACFH V1 is 2D-first with a local static armory asset",()=>{
 const svg=read("../assets/armory-environment.svg");
 const css=read("../assets/main.css");
 const html=read("../index.html");
 assert.match(svg,/<svg\b[^>]*viewBox="0 0 1600 840"/);
 assert.match(svg,/Cinematic Armory Environment/);
 assert.doesNotMatch(svg,/<script\b|<foreignObject\b|(?:href|src)\s*=\s*["\x27]https?:|javascript:/i);
 assert.match(css,/url\("\.\/armory-environment\.svg"\)/);
 assert.match(css,/@media\(max-width:530px\)/);
 assert.match(html,/ACFH \/ V1/);
 assert.match(html,/2D WORKSPACE/);
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
});
test("ACFH scene does not alter SVG AKM coordinate proportions",()=>{
 const gun=read("../assets/akm-side.svg"),mag=read("../assets/akm-magazine.svg");
 for(const svg of [gun,mag])assert.match(svg,/viewBox="0 0 1000 420"/);
 const sheet=read("../assets/main.css").split("/* === ACFH V1")[1];
 assert.ok(sheet,"ACFH styling section missing");
 assert.doesNotMatch(sheet,/scaleX\(|scaleY\(/);
});
