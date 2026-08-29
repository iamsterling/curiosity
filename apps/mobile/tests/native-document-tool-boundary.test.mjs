import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

test("native document effects require journal authorization and bounded app roots", async () => {
  const [host, store, records, module] = await Promise.all([
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/NativeDocumentHost.swift",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/NativeDocumentStore.swift",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/NativeDocumentRecords.swift",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/CuriosityRuntimeModule.swift",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  const authorization = host.indexOf("authorizeToolDispatch(request.grant)");
  assert.ok(authorization >= 0);
  for (const effect of ["store.list(", "store.read(", "store.search("])
    assert.ok(host.indexOf(effect) > authorization);
  assert.match(store, /for: \.documentDirectory/u);
  assert.match(store, /isSymbolicLink == true/u);
  assert.match(store, /standardizedFileURL\.path\.hasPrefix\(rootPath\)/u);
  assert.match(store, /NSFileCoordinator\(\)\.coordinate/u);
  assert.doesNotMatch(store, /URL\(string:/u);
  assert.match(records, /nativeSHA256\(canonicalInput\) == grant\.inputDigest/u);
  assert.match(records, /nativeSHA256\(requestJSON\) == grant\.requestDigest/u);
  assert.match(module, /OnAppEntersBackground[\s\S]*cancelAllGenerations/u);
  assert.match(module, /cancelAllGenerations[\s\S]*documentHost\.cancelAll\(\)/u);
});

test("native document tools remain outside the production local client", async () => {
  const [runtime, diagnostics, module] = await Promise.all([
    readFile(
      new URL("../src/local-curiosity-runtime.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/NativeDocumentDiagnostics.swift",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/CuriosityRuntimeModule.swift",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.doesNotMatch(runtime, /nativeDocumentTool|executeDocumentTool/u);
  assert.match(diagnostics, /^#if DEBUG/u);
  assert.match(module, /--curiosity-document-tool-fixtures/u);
});
