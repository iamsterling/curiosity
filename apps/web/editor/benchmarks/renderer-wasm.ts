import { readFileSync } from "node:fs";

const RENDERER_WASM_URL = new URL(
  "../../../../packages/scene-renderer/pkg/crafty_renderer_wasm_bg.wasm",
  import.meta.url,
);

export const readRendererWasm = (): Buffer => readFileSync(RENDERER_WASM_URL);

export const rendererWasmUrl = (): URL => RENDERER_WASM_URL;
