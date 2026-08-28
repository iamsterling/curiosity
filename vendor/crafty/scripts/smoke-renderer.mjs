/**
 * Production renderer smoke test.
 *
 * Answers the one question no other check in this repo can: does the artifact
 * an alpha user downloads actually put pixels on screen? Every other renderer
 * test runs against a hand-written fake GPU device, so the WGSL is never
 * compiled and WebGPU is never acquired.
 *
 * Drives a real headless Chrome against a real `./dist/crafty serve`.
 *
 * The assertions read the renderer's own proof chip, which is already a
 * machine-readable statement of exactly what we care about: the WASM module
 * instantiated, a WebGPU adapter/device was acquired, a 1x1 render target read
 * back the expected pixels (that is what VERIFIED means), and N draw commands
 * reached the GPU this frame. No image diffing needed to catch a dead renderer.
 *
 * Usage:  node scripts/smoke-renderer.mjs [--url http://127.0.0.1:4174]
 * Assumes the server is already running; the caller owns its lifecycle.
 */

import { spawnSync } from "node:child_process";

const BROWSER = ["--yes", "agent-browser@0.33.2"];
const url = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "http://127.0.0.1:4174";

const failures = [];
const run = (...args) => {
  const result = spawnSync("npx", [...BROWSER, ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  return (result.stdout ?? "").trim();
};
const evaluate = (expression) => {
  const raw = run("eval", expression);
  const line = raw.split("\n").filter(Boolean).at(-1) ?? "";
  try {
    return JSON.parse(JSON.parse(line));
  } catch {
    try { return JSON.parse(line); } catch { return line; }
  }
};
const check = (name, condition, detail) => {
  if (condition) {
    process.stdout.write(`  ok    ${name}\n`);
  } else {
    process.stdout.write(`  FAIL  ${name} — ${detail}\n`);
    failures.push(name);
  }
};

const state = () =>
  evaluate(
    "JSON.stringify({" +
      "gpu: typeof navigator.gpu," +
      "chip: document.querySelector('[class*=proof]')?.textContent?.trim() ?? null," +
      "warning: document.querySelector('.renderer-warning')?.textContent ?? null," +
      "canvas: (()=>{const c=document.querySelector('canvas.scene-canvas');return c?{w:c.width,h:c.height}:null})()" +
    "})",
  );

const commandCount = (chip) => Number(/(\d+)\s*cmds/i.exec(chip ?? "")?.[1] ?? NaN);

try {
  process.stdout.write(`\nRenderer smoke test against ${url}\n\n`);

  // --- initialization -----------------------------------------------------
  run("open", `${url}/files/card-demo`);
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const initial = state();

  check("WebGPU is available", initial.gpu === "object", `navigator.gpu was ${initial.gpu}`);
  check("canvas is present and sized", Boolean(initial.canvas?.w > 0 && initial.canvas?.h > 0), JSON.stringify(initial.canvas));
  check("runtime reports VERIFIED", /VERIFIED/.test(initial.chip ?? ""), `chip read: ${initial.chip}`);
  // Requires the chip to EXIST. Asserting only `warning === null` passes
  // vacuously against a page that never loaded, which is exactly the failure
  // this test is for.
  check("no renderer warning", initial.chip !== null && initial.warning === null, `chip: ${initial.chip} warning: ${initial.warning}`);
  check("draw commands reached the GPU", commandCount(initial.chip) > 0, `chip read: ${initial.chip}`);

  // --- the edit path ------------------------------------------------------
  // The regression that motivated this test: the projected scene carried the
  // persistence revision while the canvas passed the kernel's documentRevision,
  // so EVERY frame after the first mutation was discarded as stale and the
  // canvas silently froze. A smoke test that only loads the page cannot see it.
  const snapshot = run("snapshot");
  const addPage = /button "Add page" \[ref=(e\d+)\]/.exec(snapshot)?.[1];
  if (!addPage) {
    check("found a mutation control", false, "no 'Add page' button in the accessibility tree");
  } else {
    run("click", `@${addPage}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const mutated = state();
    check("renderer survives a document mutation", /VERIFIED/.test(mutated.chip ?? "") && mutated.warning === null, `chip: ${mutated.chip} warning: ${mutated.warning}`);
    check("renderer keeps drawing after mutation", commandCount(mutated.chip) > 0, `chip: ${mutated.chip}`);
  }

  // --- viewport -----------------------------------------------------------
  evaluate(
    "(()=>{const c=document.querySelector('canvas.scene-canvas');" +
      "for(let i=0;i<5;i++){c.dispatchEvent(new WheelEvent('wheel',{deltaY:-120,ctrlKey:true,clientX:400,clientY:300,bubbles:true,cancelable:true}));}" +
      "return 'ok'})()",
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const zoomed = state();
  check("renderer survives zoom", /VERIFIED/.test(zoomed.chip ?? "") && zoomed.warning === null, `chip: ${zoomed.chip} warning: ${zoomed.warning}`);

  // --- reload -------------------------------------------------------------
  run("reload");
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const reloaded = state();
  check("renderer re-initializes after reload", /VERIFIED/.test(reloaded.chip ?? "") && reloaded.warning === null, `chip: ${reloaded.chip} warning: ${reloaded.warning}`);
} finally {
  run("close", "--all");
}

process.stdout.write(
  failures.length === 0
    ? "\nRenderer smoke test passed.\n\n"
    : `\nRenderer smoke test FAILED: ${failures.join(", ")}\n\n`,
);
process.exit(failures.length === 0 ? 0 : 1);
