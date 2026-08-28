import { describe, expect, it } from "vitest";
import { readRendererWasm, rendererWasmUrl } from "./renderer-wasm.js";

describe("benchmark wasm fixture path", () => {
  it("resolves the compiled renderer module from the workspace root", () => {
    expect(rendererWasmUrl().pathname).toContain(
      "/packages/scene-renderer/pkg/crafty_renderer_wasm_bg.wasm",
    );
    expect(readRendererWasm().byteLength).toBeGreaterThan(0);
  });
});
