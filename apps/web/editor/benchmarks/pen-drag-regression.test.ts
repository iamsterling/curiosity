import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePenFile } from "@crafty/pen-import";
import { editorDocumentToScene } from "@crafty/editor/kernel";
import type { RenderFrame } from "@crafty/scene-renderer";
import { initWasm, RendererCore } from "@crafty/scene-renderer/wasm";
import { readRendererWasm } from "./renderer-wasm.js";

/**
 * Renderer regression guard over the REAL imported pipeline: a committed
 * pen.dev fixture → pen-import → the kernel's scene adapter → the WASM
 * encoder, then a changed-node batch. Lives in the app (the integration
 * surface) because the scene-renderer package must not depend on the editor
 * package — the dependency direction is editor → scene-renderer, and a
 * renderer-side devDependency on the editor would be a cycle.
 */
const loadWasm = async (): Promise<void> => {
  await initWasm({ module_or_path: readRendererWasm() });
};

const renderPacket = (core: RendererCore): RenderFrame => JSON.parse(core.render()) as RenderFrame;

describe("imported pen scene drag", () => {
  it("keeps drawing commands after moving a nested child", async () => {
    await loadWasm();
    const source = readFileSync(new URL("../../../../test-workspaces/pen/sample-card.pen", import.meta.url), "utf8");
    const imported = parsePenFile(source);
    expect(imported.ok).toBe(true);
    const scene = editorDocumentToScene(imported.document!, 1);
    const core = new RendererCore();
    core.set_viewport(0, 0, 1, 640, 480, 1);
    const bytes = new TextEncoder().encode(JSON.stringify({ ...scene, revision: 1 }));
    core.set_scene(bytes, "pen-canvas", undefined);
    const full = renderPacket(core);
    expect(full.commands.length).toBeGreaterThan(0);

    const moved = JSON.parse(JSON.stringify(scene)) as typeof scene;
    const avatar = moved.frames[0]!.layers[0]!.children!.find((layer) => layer.id === "BsX56")!;
    avatar.bounds = { ...avatar.bounds, x: avatar.bounds.x + 40, y: avatar.bounds.y + 30 };
    const deltaBytes = new TextEncoder().encode(JSON.stringify({ ...moved, revision: 2 }));
    core.set_scene(deltaBytes, "pen-canvas", JSON.stringify({ changedNodeIds: ["BsX56"] }));
    const batch = renderPacket(core);
    expect(batch.commands.length).toBeGreaterThan(0);
    expect(batch.commands.length).toBeLessThan(full.commands.length);
  });
});
