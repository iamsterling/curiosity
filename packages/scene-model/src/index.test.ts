import { describe, expect, it } from "vitest";
import { applyStoryOverrides, canonicalSceneBytes, canonicalSceneString, createSceneSpatialIndex, createSeedScene, saveScene, validateScene } from "./index.js";

describe("scene model", () => {
  it("validates the seeded visual scene", () => {
    const result = validateScene(createSeedScene());
    expect(result.ok).toBe(true);
    expect(result.value?.frames[0]?.stories).toHaveLength(2);
  });

  it("rejects unknown properties, duplicate ids, and invalid bounds", () => {
    const scene = createSeedScene() as unknown as Record<string, unknown>;
    expect(validateScene({ ...scene, unexpected: true }).ok).toBe(false);
    const frame = (scene.frames as Array<Record<string, unknown>>)[0];
    const layers = frame?.layers as Array<Record<string, unknown>>;
    expect(validateScene({ ...scene, frames: [{ ...frame, layers: [...layers, { ...layers[0] }] }] }).ok).toBe(false);
    expect(validateScene({ ...scene, frames: [{ ...frame, bounds: { x: 0, y: 0, width: 0, height: 10 } }] }).ok).toBe(false);
  });

  it("emits byte-identical canonical payloads regardless of object key order", () => {
    const scene = createSeedScene();
    const reordered = JSON.parse(JSON.stringify(scene)) as typeof scene;
    reordered.frames[0] = { stories: reordered.frames[0]!.stories, layers: reordered.frames[0]!.layers, bounds: reordered.frames[0]!.bounds, name: reordered.frames[0]!.name, id: reordered.frames[0]!.id };
    expect(canonicalSceneString(scene)).toBe(canonicalSceneString(reordered));
    expect([...canonicalSceneBytes(scene)]).toEqual([...canonicalSceneBytes(reordered)]);
  });

  it("rejects stale writes without changing the current revision", () => {
    const current = createSeedScene();
    const stale = saveScene(current, 4, current);
    expect(stale.ok).toBe(false);
    expect(stale.currentRevision).toBe(0);
    const saved = saveScene(current, 0, current);
    expect(saved.ok).toBe(true);
    expect(saved.scene?.revision).toBe(1);
  });

  it("switches visual state without mutating base-scene bytes", () => {
    const scene = createSeedScene();
    const before = canonicalSceneString(scene);
    const hover = applyStoryOverrides(scene, "frame-home", "story-hover");
    expect(hover.frames[0]?.layers[0]?.fill).toBe("#fb7185");
    expect(canonicalSceneString(scene)).toBe(before);
  });

  it("indexes visible layers in z-order without mutating the scene", () => {
    const scene = createSeedScene();
    const before = structuredClone(scene);
    const index = createSceneSpatialIndex(scene, "frame-home");
    expect(index.queryCandidates({ x: 320, y: 300 })).toEqual(["layer-badge", "layer-card"]);
    expect(index.query({ x: 0, y: 0 })).toBeUndefined();
    expect(scene).toEqual(before);

    scene.frames[0]!.layers[2]!.visible = false;
    expect(createSceneSpatialIndex(scene, "frame-home").query({ x: 320, y: 300 })).toBe("layer-card");
  });

  it("uses node transforms for world-space hit testing", () => {
    const scene = createSeedScene();
    scene.frames[0]!.layers[0]!.transform = { a: 1, b: 0, c: 0, d: 1, e: 100, f: 50 };
    const index = createSceneSpatialIndex(scene, "frame-home");
    expect(index.query({ x: 370, y: 210 })).toBe("layer-card");
    expect(index.query({ x: 270, y: 160 })).toBeUndefined();
  });
});
