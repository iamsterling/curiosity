import { describe, expect, it } from "vitest";
import type { DrawCommand, RenderFrame } from "@crafty/scene-renderer";
import { DRAW_PROTOCOL_VERSION } from "@crafty/scene-renderer";
import { initWasm, RendererCore } from "@crafty/scene-renderer/wasm";
import { serializeRenderPacket } from "@crafty/scene-renderer/wasm";
import { readRendererWasm } from "./renderer-wasm.js";

const sceneJson = (count: number, revision: number): string => {
  const layers = Array.from({ length: count }, (_, index) => (
    `{"id":"node-${index.toString().padStart(5, "0")}",`
    + `"bounds":{"x":${(index % 50) * 10},"y":${Math.floor(index / 50) * 10},"width":8,"height":8},`
    + `"transform":{"a":1,"b":0,"c":0,"d":1,"e":${index % 7},"f":${index % 5}},`
    + `"fill":"#${((index * 7) % 256).toString(16).padStart(2, "0")}1020",`
    + `"opacity":0.9,"visible":true,"zIndex":${index}}`
  ));
  return `{"revision":${revision},"frames":[{"id":"frame-1","bounds":{"x":0,"y":0,"width":500,"height":500},"layers":[${layers.join(",")}]}]}`;
};

const deltaJson = (ids: string[]): string => `{"changedNodeIds":[${ids.map((id) => `"${id}"`).join(",")}]}`;

const NODE_COUNT = 1_000;
const CHANGED_COUNT = 100;
const WARMUP_ITERATIONS = 5;
const MEASURED_SAMPLES = 21;
// Recorded evidence in this repo pins historical isolated runs at 3.18-3.70x,
// with the known load-sensitive floor dipping to 2.91x under suite load.
const MIN_MEDIAN_SPEEDUP = 2.9;

const changedIds = Array.from({ length: CHANGED_COUNT }, (_, index) => `node-${(index * 7 + 3).toString().padStart(5, "0")}`);

const median = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)]!;
};

const loadWasm = async (): Promise<void> => {
  await initWasm({ module_or_path: readRendererWasm() });
};

const renderPacket = (core: RendererCore): RenderFrame => JSON.parse(core.render()) as RenderFrame;

/**
 * The v2 delta merge contract, as the retired host applied it: replace or
 * drop retained commands for `changedNodeIds`, re-sort by (zIndex, order).
 * The host no longer merges (the scene re-encodes every frame in Rust — the
 * batch packet is re-requested as a full packet instead); this copy stays in
 * the test to verify the v2 delta itself is faithful.
 */
const mergeRetained = (retained: ReadonlyMap<string, DrawCommand>, packet: RenderFrame): DrawCommand[] | undefined => {
  if (!packet.changedNodeIds?.length) return packet.commands;
  const merged = new Map(retained);
  for (const nodeId of packet.changedNodeIds) {
    const replacement = packet.commands.find((command) => command.nodeId === nodeId);
    if (replacement) merged.set(nodeId, replacement);
    else merged.delete(nodeId);
  }
  if (merged.size === 0) return undefined;
  const commands = [...merged.values()];
  commands.sort((left, right) => left.zIndex - right.zIndex || left.order - right.order);
  return commands;
};

interface EncodeEvidence {
  bytes: number;
  fingerprint: string;
  paths: number;
  segments: number;
}

const encodeEvidence = (core: RendererCore, frame: RenderFrame): EncodeEvidence =>
  JSON.parse(core.encode_frame(serializeRenderPacket(frame))) as EncodeEvidence;

describe("protocol v2 changed-node batch (real WASM encoder)", () => {
  it("produces a batch packet whose merged commands match the full re-encode with an identical encode", async () => {
    await loadWasm();
    const core = new RendererCore();
    core.set_viewport(0, 0, 1, 640, 480, 1);
    const scene = sceneJson(NODE_COUNT, 4);

    core.set_scene(new TextEncoder().encode(scene), "frame-1", undefined);
    const fullFrame = renderPacket(core);
    expect(fullFrame.protocolVersion).toBe(DRAW_PROTOCOL_VERSION);
    expect(fullFrame.documentRevision).toBe(4);
    expect(fullFrame.changedNodeIds).toBeUndefined();
    expect(fullFrame.commands).toHaveLength(NODE_COUNT + 1);

    core.set_scene(new TextEncoder().encode(scene), "frame-1", deltaJson(changedIds));
    const batchFrame = renderPacket(core);
    expect(batchFrame.protocolVersion).toBe(DRAW_PROTOCOL_VERSION);
    expect(batchFrame.documentRevision).toBe(fullFrame.documentRevision);
    const fullPacket = fullFrame.packetRevision ?? 0;
    expect(batchFrame.packetRevision).toBe(fullPacket + 1);
    expect(batchFrame.changedNodeIds).toHaveLength(CHANGED_COUNT);
    expect(batchFrame.commands).toHaveLength(CHANGED_COUNT);
    expect(batchFrame.dirtyRegion).toBeDefined();

    const retained = new Map(fullFrame.commands.map((command) => [command.nodeId, command]));
    const merged = mergeRetained(retained, batchFrame);
    expect(merged).toEqual(fullFrame.commands);
    const mergedFrame: RenderFrame = { ...batchFrame, commands: merged! };

    // Encode-level parity (the pixel-reference comparison retired with the
    // TypeGPU host): the full and the merged rect-only packets encode through
    // the v3 pipeline to identical stream fingerprints, and the rect fast
    // path holds — one path, four segments per rect.
    const full = encodeEvidence(core, fullFrame);
    const mergedEvidence = encodeEvidence(core, mergedFrame);
    expect(mergedEvidence.fingerprint).toBe(full.fingerprint);
    expect(full.paths).toBe(fullFrame.commands.length);
    expect(full.segments).toBe(fullFrame.commands.length * 4);
  });

  it("falls back to a full re-encode when the delta names unknown nodes", async () => {
    await loadWasm();
    const core = new RendererCore();
    core.set_viewport(0, 0, 1, 640, 480, 1);
    const scene = sceneJson(NODE_COUNT, 4);

    core.set_scene(new TextEncoder().encode(scene), "frame-1", undefined);
    const fullFrame = renderPacket(core);

    core.set_scene(new TextEncoder().encode(scene), "frame-1", deltaJson(["does-not-exist", ...changedIds.slice(0, 3)]));
    const fallbackFrame = renderPacket(core);
    expect(fallbackFrame.changedNodeIds).toBeUndefined();
    expect(fallbackFrame.commands).toEqual(fullFrame.commands);
    expect(fallbackFrame.packetRevision).toBe((fullFrame.packetRevision ?? 0) + 1);
  });

  it("keeps the 1,000-node changed batch faster than the full re-encode", async () => {
    await loadWasm();
    const core = new RendererCore();
    core.set_viewport(0, 0, 1, 640, 480, 1);
    const scene = sceneJson(NODE_COUNT, 4);
    const sceneBytes = new TextEncoder().encode(scene);
    const delta = deltaJson(changedIds);

    for (let iteration = 0; iteration < WARMUP_ITERATIONS; iteration += 1) {
      core.set_scene(sceneBytes, "frame-1", undefined);
      core.render();
      core.set_scene(sceneBytes, "frame-1", delta);
      core.render();
    }

    const fullTimes: number[] = [];
    const batchTimes: number[] = [];
    for (let iteration = 0; iteration < MEASURED_SAMPLES; iteration += 1) {
      core.set_scene(sceneBytes, "frame-1", undefined);
      const fullStart = performance.now();
      core.render();
      fullTimes.push(performance.now() - fullStart);

      core.set_scene(sceneBytes, "frame-1", delta);
      const batchStart = performance.now();
      core.render();
      batchTimes.push(performance.now() - batchStart);
    }

    const fullMedian = median(fullTimes);
    const batchMedian = median(batchTimes);
    const medianSpeedup = fullMedian / batchMedian;
    console.info(`protocol-v2-batch: full re-encode ${fullMedian.toFixed(3)} ms, batch ${batchMedian.toFixed(3)} ms, median speedup ${medianSpeedup.toFixed(2)}x on ${NODE_COUNT} nodes with ${CHANGED_COUNT} changed (${MEASURED_SAMPLES} samples, ${WARMUP_ITERATIONS} warmup passes)`);

    expect(batchMedian).toBeLessThan(fullMedian);
    expect(medianSpeedup).toBeGreaterThanOrEqual(MIN_MEDIAN_SPEEDUP);
  }, 30_000);
});
