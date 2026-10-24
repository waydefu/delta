/**
 * Delta governance guard — fast, zero-dependency check for GitHub workflow safety.
 * Policy: ordinary delivery uses PR -> green CI -> merge. This guard is NOT a
 * substitute for repository settings/branch protection.
 */
import {readdirSync, readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve, dirname} from "node:path";

export function auditWorkflow(name, source) {
  const violations = [];
  const contents = String(source);
  if (/^\s*contents:\s*write\s*(?:#.*)?$/m.test(contents))
    violations.push("contents: write is disallowed in routine workflows");
  if (/\bgit\s+push\b/.test(contents))
    violations.push("git push from Actions bypasses the PR/CI gate");
  if (/^\s*pull_request_target\s*:/m.test(contents))
    violations.push("pull_request_target requires a separate threat review");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/);
    if (!match) continue;
    const action = match[1];
    if (action.startsWith("./") || action.startsWith("docker://")) continue;
    if (!/@[0-9a-f]{40}$/.test(action))
      violations.push("Action must use full 40-character SHA: " + action);
  }
  if (/^(?:prepare-akm-asset|publish-akm-model|publish-akm-magazine-candidate)\.yml$/.test(name)) {
    if (!/^on:\s*\n\s+workflow_dispatch:\s*$/m.test(contents))
      violations.push("3D conversion/publishing is manual dispatch only");
    if (/^\s+push\s*:/m.test(contents))
      violations.push("3D conversion/publishing must not auto-trigger on push");
    if (!/^\s*contents:\s*read\s*$/m.test(contents))
      violations.push("3D conversion workflows require contents: read");
  }
  return violations;
}

export function auditAll(workflows) {
  return Object.entries(workflows).flatMap(([name, source]) =>
    auditWorkflow(name, source).map(message => name + ": " + message));
}
const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  const base = resolve(dirname(thisFile), "../.github/workflows");
  const paths = readdirSync(base).filter(p => /\.ya?ml$/.test(p));
  const all = Object.fromEntries(paths.map(p => [p, readFileSync(resolve(base, p), "utf8")]));
  const violations = auditAll(all);
  if (violations.length) {
    console.error("GOVERNANCE_GUARD_FAIL\n" + violations.map(p => " - " + p).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("GOVERNANCE_GUARD_PASS " + paths.length + " workflows");
  }
}
