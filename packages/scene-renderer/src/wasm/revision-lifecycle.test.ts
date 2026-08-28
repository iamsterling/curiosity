import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  canonicalSceneBytes,
  createSeedScene,
  type Scene,
} from "@crafty/scene-model";
import type { RendererResult } from "../index.js";
import init, { RendererCore } from "../../pkg/crafty_renderer_wasm.js";
import {
  createModuleErrorRelay,
  createWebGpuRendererInstance,
  serializeRenderPacket,
} from "./webgpu-renderer.js";

/**
 * These drive the REAL compiled module, not a stub encoder. Both defects they
 * cover were invisible to the rest of the suite because every other test feeds
 * the renderer a revision that already matches the one the packet echoes.
 *
 * Headless there is no module-owned GPU: `init_canvas` never ran, so the
 * module rejects every `render_packet` with `VELLO_RENDER_FAILED:
 * device-not-initialized`. A frame that passes the host gate therefore comes
 * back as exactly that failure — the witness that the packet crossed every
 * host check and reached the module — while a frame the gate rejects comes
 * back `STALE_REVISION` and never crosses. The gate-passed witness is what
 * the success-path assertions of this suite became.
 */

const passedGate = (result: RendererResult): boolean =>
  result.ok === false && result.diagnostics[0]?.code === "VELLO_RENDER_FAILED";

const newInstance = () =>
  createWebGpuRendererInstance(new RendererCore(), createModuleErrorRelay());

const primed = (scene: Scene) => {
  const instance = newInstance();
  const frameId = scene.frames[0]!.id;
  instance.setScene(canonicalSceneBytes(scene), frameId);
  instance.setViewport({ panX: 0, panY: 0, zoom: 1 } as never, {
    width: 640,
    height: 360,
    pixelRatio: 1,
  });
  return instance;
};

beforeAll(async () => {
  await init({
    module_or_path: await readFile(
      new URL("../../pkg/crafty_renderer_wasm_bg.wasm", import.meta.url),
    ),
  });
});

describe("render packet revision lifecycle", () => {
  it("passes a frame whose requested revision matches the scene through the host gate", () => {
    const scene = createSeedScene();
    const result = primed(scene).render(
      undefined,
      undefined,
      1,
      scene.revision,
    );
    expect(passedGate(result)).toBe(true);
    expect(result.diagnostics[0]?.message).toBe("The Vello render or present step failed.");
  });

  it("discards a packet whose document revision is not the one requested", () => {
    const scene = createSeedScene();
    const result = primed(scene).render(
      undefined,
      undefined,
      1,
      scene.revision + 7,
    );
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("STALE_REVISION");
  });

  it("recovers on the next matching request instead of wedging permanently", () => {
    // Regression: the packet-revision cursor used to advance only on the
    // success path, so ONE discarded frame left it behind forever and every
    // later frame failed the contiguity check. The renderer never drew again.
    const scene = createSeedScene();
    const instance = primed(scene);

    expect(
      passedGate(instance.render(undefined, undefined, 1, scene.revision)),
    ).toBe(true);
    expect(
      instance.render(undefined, undefined, 2, scene.revision + 7)
        .diagnostics[0]?.code,
    ).toBe("STALE_REVISION");

    expect(
      passedGate(instance.render(undefined, undefined, 3, scene.revision)),
    ).toBe(true);
    expect(
      passedGate(instance.render(undefined, undefined, 4, scene.revision)),
    ).toBe(true);
  });

  it("recovers after several consecutive discards", () => {
    const scene = createSeedScene();
    const instance = primed(scene);
    expect(
      passedGate(instance.render(undefined, undefined, 1, scene.revision)),
    ).toBe(true);
    for (let sequence = 2; sequence <= 5; sequence += 1) {
      expect(
        instance.render(
          undefined,
          undefined,
          sequence,
          scene.revision + sequence,
        ).diagnostics[0]?.code,
      ).toBe("STALE_REVISION");
    }
    expect(
      passedGate(instance.render(undefined, undefined, 6, scene.revision)),
    ).toBe(true);
  });
});

describe("packet serialization for module submission", () => {
  it("round-trips the encoder's own packet without losing the i64 zIndex sentinel", () => {
    // Regression: the frame-background rect carries zIndex = i64::MIN, which
    // a plain JSON.parse -> JSON.stringify round-trip turns into
    // -9223372036854776000 — a value the module rejects for its i64 field,
    // so the very first packet the host submitted failed to decode. The host
    // serializer clamps unrepresentable integers to safe bounds.
    const scene = createSeedScene();
    const core = new RendererCore();
    core.set_scene(canonicalSceneBytes(scene), scene.frames[0]!.id, null);
    core.set_viewport(0, 0, 1, 640, 360, 1);
    const packet = JSON.parse(core.render()) as Parameters<
      typeof serializeRenderPacket
    >[0];
    expect(packet.commands[0]?.zIndex).toBe(-9223372036854775808);

    const reencoded = core.encode_frame(serializeRenderPacket(packet));
    const evidence = JSON.parse(reencoded) as {
      bytes: number;
      paths: number;
      segments: number;
    };
    expect(evidence.paths).toBe(packet.commands.length);
    // The seed's card and badge carry cornerRadius (24/19) — rounded rects
    // encode as 7 path segments each; the frame background stays a
    // 4-segment plain rect. The title layer is TEXT: its scene rect is
    // invisible scaffolding (protocol v5) and contributes no segments.
    // (Rounded rects rendered square before the corner-radius channel
    // landed; this pins the rounded encoding.)
    expect(evidence.segments).toBe(7 * 2 + 4);
  });
});
