// Permanent build-time patch for packages/scene-renderer/pkg/crafty_renderer_wasm.js.
//
// WHY: wasm-bindgen-futures frees a JsFuture's resolve/reject once-closures at
// settlement (js-sys `finish` drops both from inside the invoked one). If the
// browser's promise machinery fires a cleared reaction again, the freed
// wrapper's `real` calls into wasm with a zeroed slot pointer and wasm throws
// "closure invoked recursively or after being dropped" — observed in Chrome on
// every page load (the requestAdapter/requestDevice chains). The module
// cannot fix js-sys's internals, and the per-module GPU singleton already
// prevents the concurrent-request race (wasm-boundary.md); this patch is the
// invariant that makes the panic class IMPOSSIBLE regardless of trigger: a
// zeroed slot is a logged no-op, never a wasm call.
//
// Idempotent; fails loudly if the generated shape changes.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = process.cwd().endsWith(`${path.sep}scene-renderer`)
  ? process.cwd()
  : path.resolve(process.cwd(), "packages/scene-renderer");
const pkgPath = path.join(packageRoot, "pkg/crafty_renderer_wasm.js");
let js = readFileSync(pkgPath, "utf8");

if (js.includes("wbg-closure-guard")) {
  process.stdout.write("[wbg-closure-guard] already patched\n");
  process.exit(0);
}

const guard = `        const a = state.a;
        state.a = 0;
        // wbg-closure-guard: a zeroed slot means the closure was freed while
        // JS still held a reference (wasm-bindgen-futures frees JsFuture
        // once-closures at settlement). Calling into wasm with a == 0 makes
        // wasm throw "closure invoked recursively or after being dropped";
        // a logged no-op keeps the frame alive instead.
        if (a === 0) {
            console.warn("[wbg-closure-guard] zeroed-slot invocation suppressed (closure freed at settlement, then fired again)");
            return;
        }`;

const from = `        const a = state.a;
        state.a = 0;`;

if (!js.includes(from)) {
  console.error("[wbg-closure-guard] generated shape changed — the guard must be re-derived against the new wasm-bindgen output");
  process.exit(1);
}

js = js.replace(from, guard);
writeFileSync(pkgPath, js);
process.stdout.write(`[wbg-closure-guard] patched: ${pkgPath}\n`);
