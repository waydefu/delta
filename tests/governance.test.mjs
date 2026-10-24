import test from "node:test";
import assert from "node:assert/strict";
import {auditWorkflow, auditAll} from "../scripts/governance-check.mjs";

const safe = `name: Safe
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
`;
test("safe dispatch-only workflow accepted", () => assert.deepEqual(auditWorkflow("prepare-akm-asset.yml", safe), []));
test("unpinned action denied", () => assert.match(auditWorkflow("ci.yml", safe.replace(/@[0-9a-f]{40}/,"@v4")).join(" "), /40-character SHA/));
test("write tokens denied", () => assert.match(auditWorkflow("ci.yml",safe.replace("contents: read","contents: write")).join(" "),/contents: write/));
test("direct push denied", () => assert.match(auditWorkflow("ci.yml",safe+"      - run: git push origin HEAD:main\n").join(" "),/git push/));
test("pull_request_target denied", () => assert.match(auditWorkflow("ci.yml",safe+"  pull_request_target:\n").join(" "),/pull_request_target/));
test("3D workflow push auto trigger denied", () => assert.match(auditWorkflow("publish-akm-model.yml", safe+"  push:\n    branches: [main]\n").join(" "),/auto-trigger/));
test("aggregate results retain workflow path", () => assert.match(auditAll({"ci.yml":safe+"      - run: git push origin HEAD:main\n"}).join(" "),/ci.yml/));
