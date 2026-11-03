import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {getYieldGroups,getYieldRows,benefitPercent,isCurrentDetailKnown,parseDetailNumber} from "../src/benefit-data.mjs";

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
const details=read("../data/weapons/akm-details.json");
const protocol=read("../data/research/akm-precision-protocol.json");
const dataset=read("../data/research/akm-benefit-samples.json");
const groups=getYieldGroups(details,protocol);

test("all five scored attribute families use only actually measured baseline detail values",()=>{
 assert.deepEqual(groups.map(x=>x.id),["damage","recoil","handling","stability","hipfire"]);
 assert.deepEqual(groups.map(x=>x.metrics.length),[5,5,9,6,2]);
 assert.deepEqual(groups.map(x=>x.baseScore),[40,39,54,55,53]);
 for(const group of groups){
   for(const metric of group.metrics){
     assert.ok(Number.isFinite(metric.baseValue));
     const rows=getYieldRows(group,metric.key);
     assert.equal(rows.length,101);
     assert.deepEqual(rows.filter(r=>r.value!==null).map(r=>r.score),[group.baseScore]);
     assert.equal(rows[group.baseScore].benefit,0);
   }
 }
});
test("2025 warfare reference is scoped and does not infer the missing 41–100 scores",()=>{
 const recoil=groups.find(x=>x.id==="recoil");
 const rows=getYieldRows(recoil,"autoVerticalRecoilMultiplier",dataset.reference.historical);
 assert.equal(rows[39].value,1);
 assert.equal(rows[40].value,0.98);
 assert.equal(rows[40].benefit,2.0000000000000018);
 assert.equal(rows[41].value,null);
 assert.equal(rows[49].value,null);
 assert.equal(rows[74].value,null);
 assert.equal(rows[100].value,null);
});
test("firing stability sample uses its own observed change, not main recoil conversion",()=>{
 const recoil=groups.find(x=>x.id==="recoil");
 const rows=getYieldRows(recoil,"weaponFiringStability",dataset.reference.historical);
 assert.equal(rows[39].value,1);
 assert.equal(rows[40].value,0.99);
 assert.ok(Math.abs(rows[40].benefit-1)<1e-9);
});
test("benefit is defined by the measured physical value: no change is zero; missing or zero baseline unknown",()=>{
 assert.equal(benefitPercent(1,1,"lower"),0);
 assert.equal(benefitPercent(1,1,null),0);
 assert.equal(benefitPercent(0,1,"lower"),null);
 assert.equal(benefitPercent(1,NaN,"lower"),null);
 assert.equal(benefitPercent(100,80,"lower"),20);
 assert.equal(benefitPercent(100,120,"higher"),20);
 assert.equal(benefitPercent(1,.98,"higher"),-2.0000000000000018);
});
test("same main score cannot prove the current build has unchanged detailed effects",()=>{
 const recoil=groups.find(x=>x.id==="recoil");
 assert.equal(isCurrentDetailKnown(39,recoil,0,null),true);
 assert.equal(isCurrentDetailKnown(39,recoil,1,null),false);
 assert.equal(isCurrentDetailKnown(40,recoil,0,null),false);
 assert.equal(isCurrentDetailKnown(39,recoil,0,dataset.reference.historical),false);
});
test("archive mismatches, duplicate and invalid observations are rejected",()=>{
 const recoil=groups.find(x=>x.id==="recoil");
 assert.throws(()=>getYieldRows(recoil,"adsTime"),/Unknown detailed metric/);
 assert.throws(()=>getYieldRows(recoil,"autoVerticalRecoilMultiplier",{group:"handling",samples:[]}),/Archive group mismatch/);
 assert.throws(()=>getYieldRows(recoil,"autoVerticalRecoilMultiplier",{group:"recoil",samples:[{score:101,metrics:{autoVerticalRecoilMultiplier:1}}]}),/Out-of-range/);
 assert.throws(()=>getYieldRows(recoil,"autoVerticalRecoilMultiplier",{group:"recoil",samples:[{score:39,metrics:{autoVerticalRecoilMultiplier:1}},{score:39,metrics:{autoVerticalRecoilMultiplier:1}}]}),/duplicated/);
});
test("numeric and unit parsing preserves verified screenshot values",()=>{
 assert.deepEqual(parseDetailNumber("1×"),{value:1,unit:"×"});
 assert.deepEqual(parseDetailNumber("327 ms"),{value:327,unit:"ms"});
 assert.deepEqual(parseDetailNumber("1.82 m/s"),{value:1.82,unit:"m/s"});
 assert.equal(parseDetailNumber("尚未驗證"),null);
});
