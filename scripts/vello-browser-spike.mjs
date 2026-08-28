/**
 * Fail-closed browser harness for the vector-path present spike.
 *
 * This is deliberately an acceptance harness, not a substitute for GPU
 * evidence. It waits for the proof chip to report a real submitted frame and
 * emits structured blockers when the page, WASM module, WebGPU device, or
 * present path is not ready. A run without WebGPU therefore fails; it never
 * turns a missing signal into a passing result.
 *
 * Usage (with a production/preview server already running):
 *   node scripts/vello-browser-spike.mjs --url https://127.0.0.1:4173
 *   node scripts/vello-browser-spike.mjs --capture /tmp/vello-spike.png
 */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};
const port = Number(arg("--port", "4173"));
const route = arg("--route", "/editor/card-demo");
const slug = arg("--slug", "card-demo");
const url = arg("--url", `http://127.0.0.1:${port}`);
const capture = process.argv.includes("--capture") ? arg("--capture", undefined) : undefined;
const timeoutMs = Number(arg("--timeout", "30000"));
const namespace = arg("--namespace", `vello-browser-spike-${process.pid}`);
const wasmPath = arg("--wasm", "packages/scene-renderer/pkg/crafty_renderer_wasm_bg.wasm");
const wasmHash = createHash("sha256").update(readFileSync(wasmPath)).digest("hex");
const browserArgs = "--enable-unsafe-webgpu,--disable-software-rasterizer";
const BROWSER = [
  "--yes", "agent-browser@0.33.2", "--namespace", namespace,
  "--session", namespace, "--args", browserArgs,
];

const run = (...args) => {
  const result = spawnSync("npx", [...BROWSER, ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`agent-browser exited ${result.status}: ${(result.stderr ?? result.stdout ?? "").trim()}`);
  }
  return (result.stdout ?? "").trim();
};

const evaluate = (expression) => {
  const raw = run("eval", expression);
  const line = raw.split("\n").filter(Boolean).at(-1) ?? "";
  try { return JSON.parse(JSON.parse(line)); } catch {
    try { return JSON.parse(line); } catch { return undefined; }
  }
};

const readState = () => evaluate(
  "JSON.stringify((()=>{" +
    "const chip=document.querySelector('[data-testid=renderer-proof]');" +
    "const canvas=document.querySelector('canvas.scene-canvas');" +
    "return {" +
      "gpu:typeof navigator.gpu," +
      "chip:chip?.textContent?.trim()??null," +
      "warning:document.querySelector('.renderer-warning')?.textContent?.trim()??null," +
      "canvas:canvas?{width:canvas.width,height:canvas.height,cssWidth:canvas.getBoundingClientRect().width,cssHeight:canvas.getBoundingClientRect().height}:null," +
      "dpr:window.devicePixelRatio," +
      "colorSpace:canvas?.getContext('webgpu')?.getConfiguration?.().colorSpace??null," +
      "ua:navigator.userAgent" +
    "};" +
  "})())",
);

const blockers = (state) => {
  const result = [];
  if (!state) return ["PAGE_STATE_UNAVAILABLE"];
  if (state.gpu !== "object") result.push("WEBGPU_UNAVAILABLE");
  if (!state.canvas || state.canvas.width <= 0 || state.canvas.height <= 0) result.push("CANVAS_NOT_READY");
  if (state.chip === null) result.push("RENDERER_PROOF_MISSING");
  else if (!/VERIFIED/.test(state.chip)) result.push("RENDERER_NOT_READY");
  if (state.warning !== null) result.push("RENDERER_DIAGNOSTIC_PRESENT");
  if (state.chip !== null && !/\d+\s*cmds/i.test(state.chip)) result.push("DRAW_EVIDENCE_MISSING");
  return result;
};

let finalState;
let failure;
try {
  run("open", `${url}${route.replace(":slug", slug)}`);
  const deadline = Date.now() + timeoutMs;
  do {
    await new Promise((resolve) => setTimeout(resolve, 500));
    finalState = readState();
    if (blockers(finalState).length === 0) break;
  } while (Date.now() < deadline);

  const remaining = blockers(finalState);
  if (remaining.length > 0) {
    failure = { status: "blocked", url, route, slug, namespace, wasmPath, wasmHash, browserArgs, blockers: remaining, state: finalState ?? null };
  } else {
    if (capture) {
      mkdirSync(dirname(capture), { recursive: true });
      run("screenshot", capture);
    }
    failure = { status: "ready", url, route, slug, namespace, wasmPath, wasmHash, browserArgs, blockers: [], state: finalState, ...(capture ? { capture } : {}) };
  }
} catch (error) {
  failure = { status: "error", url, route, slug, namespace, wasmPath, wasmHash, browserArgs, blockers: ["HARNESS_EXECUTION_FAILED"], error: String(error) };
} finally {
  try { run("close", "--all"); } catch { /* preserve the primary result */ }
}

process.stdout.write(`${JSON.stringify(failure, null, 2)}\n`);
process.exit(failure.status === "ready" ? 0 : 2);
