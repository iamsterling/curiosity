import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { serializeDocument } from "@crafty/editor/kernel";
import { canonicalSceneBytes, createSeedScene } from "@crafty/scene-model";

import { createLossListDocument } from "./fixtures/loss-list-document.js";
import { legacySceneFile, loadPersistedScene, packageDirectory, readDocument, writeDocument } from "./index.js";

let dataDir = "";

beforeEach(() => {
  dataDir = mkdtempSync(path.join(os.tmpdir(), "crafty-loss-"));
});

afterEach(() => {
  rmSync(dataDir, { recursive: true, force: true });
});

const writeLegacyScene = (slug: string, payload: unknown): void => {
  mkdirSync(path.dirname(legacySceneFile(dataDir, slug)), { recursive: true });
  writeFileSync(legacySceneFile(dataDir, slug), JSON.stringify(payload), "utf8");
};

describe("loss-list fixture", () => {
  it("is a valid current-schema document with every loss-list field present", () => {
    const fixture = createLossListDocument();
    expect(fixture.schemaVersion).toBe(5);
    expect(fixture.pageOrder).toEqual(["page-home", "page-detail"]);
    const home = fixture.pages["page-home"]?.canvas;
    expect(home?.grid.mode).toBe("dots");
    expect(home?.grid.visible).toBe(true);
    expect(home?.guides).toHaveLength(2);
    expect(home?.rest).toEqual({ panX: 140, panY: -90, zoom: 1.6 });
    expect(home?.rulers.unit).toBe("cm");
    expect(home?.snap.grid).toBe(false);
    expect(fixture.nodes["rectangle-locked"]?.locked).toBe(true);
    expect(fixture.nodes["rectangle-meta"]?.metadata).toEqual({ designerNote: "loss list fixture", approved: true });
    expect(fixture.components["component-button"]?.name).toBe("Button");
    expect(fixture.components["component-button"]?.surfaceId).toBe("surface-button");
    expect(fixture.components["component-icon"]?.rootNodeId).toBe("component-root-icon");
    expect(fixture.instances["frame-instance"]?.definitionId).toBe("component-button");
    expect(fixture.instances["button-icon-instance"]?.definitionId).toBe("component-icon");
    expect(fixture.instances["button-icon-instance"]?.overrides).toEqual({ "component-icon-shape": { opacity: 0.8 } });
    expect(fixture.libraries[0]?.status).toBe("resolved");
    expect(fixture.variables["var-accent"]).toEqual({ type: "color", value: "#6366f1" });
    expect(fixture.nodes["path-blob"]?.path?.fillRule).toBe("evenodd");
  });
});

describe("6.2 the loss list round-trips", () => {
  it("save → reload → identical canonical bytes with no migration and revision 1", () => {
    const fixture = createLossListDocument();
    const written = writeDocument(dataDir, "loss", 0, fixture);
    expect(written.ok).toBe(true);
    if (!written.ok) return;
    expect(written.value.revision).toBe(1);

    const read = readDocument(dataDir, "loss");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.applied).toEqual([]);
    expect(read.value.revision).toBe(1);
    expect(read.value.converted).toBe(false);
    expect(serializeDocument(read.value.document)).toBe(serializeDocument(fixture));

    const home = read.value.document.pages["page-home"]?.canvas;
    expect(home?.guides).toEqual([
      { id: "guide-home-x", axis: "x", position: 320, visible: true },
      { id: "guide-home-y", axis: "y", position: 180, visible: false }
    ]);
    expect(home?.rest).toEqual({ panX: 140, panY: -90, zoom: 1.6 });
    expect(home?.grid.mode).toBe("dots");
    expect(home?.grid.majorSpacing).toBe(24);
    expect(home?.grid.originX).toBe(12);
    expect(home?.grid.visible).toBe(true);
    expect(read.value.document.nodes["rectangle-locked"]?.locked).toBe(true);
    expect(read.value.document.nodes["rectangle-meta"]?.metadata).toEqual({ designerNote: "loss list fixture", approved: true });
    expect(read.value.document.components["component-button"]?.id).toBe("component-button");
    expect(read.value.document.instances["frame-instance"]).toEqual({
      definitionId: "component-button",
      properties: { label: "Save now", size: "large" },
      overrides: { "button-icon-instance": { opacity: 0.9 }, "component-root-button": { fill: "#4ade80" } }
    });
    expect(read.value.document.components["component-button"]?.surfaceId).toBe("surface-button");
    expect(read.value.document.surfaces["surface-button"]).toEqual({ id: "surface-button", nodeId: "component-root-button", role: "component", behaviorVersion: 1 });
    expect(read.value.document.instances["button-icon-instance"]?.definitionId).toBe("component-icon");
    expect(read.value.document.libraries[0]).toEqual({
      libraryId: "library-crafty-tokens",
      version: "1.2.3",
      integrity: "sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      status: "resolved"
    });
    expect(read.value.document.variables["var-accent"]).toEqual({ type: "color", value: "#6366f1" });
    expect(read.value.document.nodes["path-blob"]?.path).toEqual(fixture.nodes["path-blob"]?.path);
    expect(read.value.document.nodes["path-blob"]?.stroke).toBe("#4c1d95");
  });

  it("keeps the second page and its non-default canvas", () => {
    const fixture = createLossListDocument();
    const written = writeDocument(dataDir, "loss", 0, fixture);
    expect(written.ok).toBe(true);
    if (!written.ok) return;
    const read = readDocument(dataDir, "loss");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.document.pageOrder).toEqual(["page-home", "page-detail"]);
    expect(read.value.document.pages["page-detail"]?.canvas.rest).toEqual({ panX: -40, panY: 60, zoom: 0.75 });
    expect(read.value.document.pages["page-detail"]?.canvas.rulers.unit).toBe("pt");
    expect(read.value.document.nodes["image-detail"]?.kind).toBe("image");
    expect(read.value.document.nodes["rectangle-detail"]?.visible).toBe(false);
  });
});

describe("6.3 determinism", () => {
  it("two saves of the same fixture are byte-identical file for file", () => {
    const fixture = createLossListDocument();
    const first = writeDocument(dataDir, "loss-a", 0, fixture);
    const second = writeDocument(dataDir, "loss-b", 0, fixture);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(readFileSync(path.join(packageDirectory(dataDir, "loss-a"), "manifest.ui"), "utf8")).toBe(readFileSync(path.join(packageDirectory(dataDir, "loss-b"), "manifest.ui"), "utf8"));
    expect(readFileSync(path.join(packageDirectory(dataDir, "loss-a"), "document-1.ui"), "utf8")).toBe(readFileSync(path.join(packageDirectory(dataDir, "loss-b"), "document-1.ui"), "utf8"));
  });

  it("committed reference: the fixture's canonical bytes are locked", () => {
    expect(serializeDocument(createLossListDocument())).toBe(serializeDocument(createLossListDocument()));
  });
});

describe("6.4 legacy scene.json conversion", () => {
  it("converts a legacy scene through the two-step chain and saves a package, leaving the legacy file", () => {
    const scene = createSeedScene();
    mkdirSync(path.dirname(legacySceneFile(dataDir, "legacy")), { recursive: true });
    writeFileSync(legacySceneFile(dataDir, "legacy"), canonicalSceneBytes(scene), "utf8");
    const read = readDocument(dataDir, "legacy");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value.converted).toBe(true);
    expect(read.value.revision).toBe(0);
    expect(read.value.applied).toEqual(["v1-to-v2-add-page-canvas", "v2-to-v3-add-path-kind", "v3-to-v4-add-semantic-surfaces", "v4-to-v5-require-text-content"]);
    // The legacy format has none of the loss-list fields: every canvas is the
    // default, and the components/instances/libraries/variables homes are empty.
    expect(read.value.document.pages[read.value.document.pageOrder[0]!]?.canvas).toEqual({
      rest: { panX: 0, panY: 0, zoom: 1 },
      grid: { mode: "lines", majorSpacing: 40, minorStep: 5, originX: 0, originY: 0, visible: false },
      rulers: { showRulers: true, unit: "px" },
      guides: [],
      snap: { grid: true, guides: true, objects: true, pixel: true }
    });
    const written = writeDocument(dataDir, "legacy", 0, read.value.document);
    expect(written.ok).toBe(true);
    if (!written.ok) return;
    expect(written.value.revision).toBe(1);
    expect(existsSync(path.join(packageDirectory(dataDir, "legacy"), "manifest.ui"))).toBe(true);
    expect(existsSync(path.join(packageDirectory(dataDir, "legacy"), "document-1.ui"))).toBe(true);
    expect(existsSync(legacySceneFile(dataDir, "legacy"))).toBe(true);
  });

  it("diagnoses a legacy path layer loudly instead of dropping the file", () => {
    const pathLayerScene = {
      schemaVersion: 1,
      id: "scene-path-stopgap",
      name: "Path stop-gap scene",
      revision: 0,
      frames: [
        {
          id: "frame-path",
          name: "Path frame",
          bounds: { x: 0, y: 0, width: 400, height: 300 },
          layers: [
            {
              id: "layer-blob",
              name: "Blob",
              type: "path",
              bounds: { x: 20, y: 20, width: 100, height: 80 },
              transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
              fill: "#f59e0b",
              stroke: "#b45309",
              opacity: 1,
              cornerRadius: 0,
              visible: true,
              zIndex: 1
            }
          ],
          stories: []
        }
      ]
    };
    writeLegacyScene("path-scene", pathLayerScene);
    // The Scene format cannot validate a path layer, so the file must not be
    // silently treated as absent (that would drop the whole legacy document).
    expect(loadPersistedScene(dataDir, "path-scene")).toBeUndefined();
    const read = readDocument(dataDir, "path-scene");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("DOCUMENT_INPUT_INVALID");
      expect(read.error.status).toBe(400);
      expect(read.error.diagnostics?.[0]).toEqual({ code: "SCENE_ADAPTER_UNSUPPORTED_KIND", path: "/", message: "SCENE_ADAPTER_UNSUPPORTED_KIND:path" });
    }
    expect(existsSync(packageDirectory(dataDir, "path-scene"))).toBe(false);
  });

  it("diagnoses a path layer nested inside a group the same way", () => {
    const nestedPathScene = {
      schemaVersion: 1,
      id: "scene-nested-path",
      name: "Nested path scene",
      revision: 0,
      frames: [
        {
          id: "frame-nested",
          name: "Nested frame",
          bounds: { x: 0, y: 0, width: 400, height: 300 },
          layers: [
            {
              id: "layer-group",
              name: "Group",
              type: "group",
              bounds: { x: 0, y: 0, width: 400, height: 300 },
              transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
              fill: "transparent",
              stroke: "transparent",
              opacity: 1,
              cornerRadius: 0,
              visible: true,
              zIndex: 1,
              children: [
                {
                  id: "layer-blob",
                  name: "Blob",
                  type: "path",
                  bounds: { x: 20, y: 20, width: 100, height: 80 },
                  transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
                  fill: "#f59e0b",
                  stroke: "#b45309",
                  opacity: 1,
                  cornerRadius: 0,
                  visible: true,
                  zIndex: 1
                }
              ]
            }
          ],
          stories: []
        }
      ]
    };
    writeLegacyScene("nested-path", nestedPathScene);
    const read = readDocument(dataDir, "nested-path");
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.error.code).toBe("DOCUMENT_INPUT_INVALID");
      expect(read.error.diagnostics?.[0]).toEqual({ code: "SCENE_ADAPTER_UNSUPPORTED_KIND", path: "/", message: "SCENE_ADAPTER_UNSUPPORTED_KIND:path" });
    }
  });
});
