import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LIGHTING_PRESETS,validLightingPreset,isIndependentPart,findPartNodes} from "../src/local-viewer.mjs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const viewer=read("../src/local-viewer.mjs");
const controller=read("../src/model-reference.mjs");
const gunsmith=read("../src/gunsmith.mjs");
const css=read("../assets/main.css");

test("three on-demand real-light studio presets are bounded and do not replace artist materials",()=>{
 assert.deepEqual(Object.keys(LIGHTING_PRESETS),["cinematic","neutral","inspection"]);
 for(const [id,preset] of Object.entries(LIGHTING_PRESETS)){
  assert.equal(validLightingPreset(id),id);
  assert.ok(preset.key>0&&preset.ambient>0&&preset.rim>0);
  assert.ok(preset.exposure>=.7&&preset.exposure<=1.3);
 }
 assert.equal(validLightingPreset("untrusted"),"cinematic");
 assert.match(viewer,/scene\.environment=roomTarget\.texture/);
 assert.match(viewer,/THREE\.MeshStandardMaterial/);
 assert.match(viewer,/renderer\.toneMapping=THREE\.ACESFilmicToneMapping/);
 assert.match(viewer,/renderer\.shadowMap\.enabled=true/);
 assert.match(viewer,/if\(!isTouch\)\{/);
 assert.doesNotMatch(viewer,/mesh\.material\s*=\s*new THREE\.Mesh/);
 assert.match(viewer,/scene\.add\(ground\)/);
});
test("camera focus is permitted only on independently named real meshes",()=>{
 const parts=findPartNodes(["AKM_Body","AKM_Magazine"]);
 assert.deepEqual(parts.magazine,["AKM_Magazine"]);
 assert.deepEqual(parts.stock,[]);
 assert.equal(isIndependentPart(parts,"magazine"),true);
 assert.equal(isIndependentPart(parts,"stock"),false);
 assert.equal(isIndependentPart(parts,"muzzle"),false);
 assert.equal(isIndependentPart({magazine:[]},"magazine"),false);
 assert.equal(isIndependentPart(null,"magazine"),false);
 assert.match(viewer,/function focusPart\(part\)/);
 assert.match(viewer,/part!=="magazine"/);
 assert.match(viewer,/canvas\.dataset\.cameraFocus=focusName/);
 assert.match(viewer,/controls\.addEventListener\("start",stopCameraMotion\)/);
 assert.match(viewer,/cancelCameraMotion\?\.\(\)/);
 assert.match(viewer,/if\(!canMoveCamera\(\)\)/);
});
test("cinematic controls show known build but refuse fabricated 3D attachment swaps",()=>{
 for(const label of ["電影光影","材質比對","細節檢視","聚焦彈匣","重設視角"]){
  assert.ok(controller.includes(label),label);
 }
 assert.match(controller,/setLightingPreset\(preset\)/);
 assert.match(controller,/instance\.focusPart\("magazine"\)/);
 assert.match(controller,/3D 模型未隨配件更換/);
 assert.match(controller,/setConfiguration,/);
 assert.match(gunsmith,/modelReference\.setConfiguration/);
 assert.match(css,/\.local-3d-cinematic-hud/);
 assert.match(css,/\.local-viewer-preset\[aria-pressed="true"\]/);
 assert.match(css,/@media\(max-width:760px\)/);
 const app=read("../src/app.mjs");
 assert.doesNotMatch(app,/setLightingPreset|focusPart/,"Research stat engine must remain isolated from 3D controls");
});
