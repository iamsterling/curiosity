import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createCraftyKernelFromUiPackage } from "../src/crafty/crafty-kernel-portability.ts";
import { serializeCraftyNativeFrame } from "../src/crafty/crafty-native-frame.ts";
import { CraftySelectionInteraction } from "../src/crafty/crafty-selection-interaction.ts";
import { CraftyCreationInteraction } from "../src/crafty/crafty-creation-interaction.ts";
import { applyCraftyAccessibilityCommand } from "../src/crafty/crafty-accessibility-interaction.ts";

const readFixture = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("mobile renders the canonical EditorKernel rectangle packet", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({
    devicePixelRatio: 2,
    panX: 200,
    panY: 212.5,
    zoom: 0.75,
  });

  const initial = JSON.parse(
    serializeCraftyNativeFrame(kernel, {
      height: 800,
      pixelRatio: 2,
      width: 1_000,
    }),
  );
  const rectangle = initial.commands.find(
    (command) => command.nodeId === "rectangle-portability",
  );

  assert.equal(initial.protocolVersion, 5);
  assert.equal(initial.frameId, "portability");
  assert.deepEqual(initial.viewport, {
    height: 800,
    panX: 200,
    panY: 212.5,
    pixelRatio: 2,
    width: 1_000,
    zoom: 0.75,
  });
  assert.deepEqual(rectangle.bounds, { height: 132, width: 240, x: 0, y: 0 });
  assert.deepEqual(rectangle.transform, {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 64,
    f: 84,
  });
  assert.equal(rectangle.cornerRadius, 18);
  assert.equal(initial.documentRevision, 0);

  kernel.dispatch(
    {
      delta: { dx: 24, dy: 16 },
      nodeIds: ["rectangle-portability"],
      type: "move-nodes",
    },
    "Move rectangle",
  );
  const moved = JSON.parse(
    serializeCraftyNativeFrame(kernel, {
      height: 800,
      pixelRatio: 2,
      width: 1_000,
    }),
  );
  const movedRectangle = moved.commands.find(
    (command) => command.nodeId === "rectangle-portability",
  );

  assert.equal(moved.documentRevision, 1);
  assert.equal(movedRectangle.transform.e, 88);
  assert.equal(movedRectangle.transform.f, 100);
});

test("native pointer input selects and moves through one kernel history entry", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  const interaction = new CraftySelectionInteraction(kernel);

  interaction.handle({ phase: "down", pointerId: 1, x: 100, y: 100 });
  assert.deepEqual(kernel.getState().selectedIds, ["rectangle-portability"]);

  const selectedFrame = JSON.parse(
    serializeCraftyNativeFrame(kernel, {
      height: 800,
      pixelRatio: 2,
      width: 1_000,
    }),
  );
  assert.deepEqual(selectedFrame.selectionBounds, {
    height: 132,
    width: 240,
    x: 64,
    y: 84,
  });
  assert.deepEqual(
    selectedFrame.commands
      .filter((command) => command.nodeId.startsWith("selection-outline-"))
      .map((command) => command.nodeId),
    [
      "selection-outline-top",
      "selection-outline-bottom",
      "selection-outline-left",
      "selection-outline-right",
    ],
  );
  assert.equal(
    selectedFrame.commands.filter((command) =>
      command.nodeId.startsWith("selection-handle-"),
    ).length,
    16,
  );

  interaction.handle({ phase: "move", pointerId: 1, x: 130, y: 120 });
  interaction.handle({ phase: "up", pointerId: 1, x: 130, y: 120 });
  assert.deepEqual(kernel.getDocument().nodes["rectangle-portability"].bounds, {
    height: 132,
    width: 240,
    x: 94,
    y: 104,
  });
  assert.equal(kernel.canUndo(), true);
  assert.equal(kernel.undo(), true);
  assert.equal(kernel.canUndo(), false);
  assert.deepEqual(kernel.getDocument().nodes["rectangle-portability"].bounds, {
    height: 132,
    width: 240,
    x: 64,
    y: 84,
  });
  assert.equal(kernel.redo(), true);
  assert.equal(
    kernel.getDocument().nodes["rectangle-portability"].bounds.x,
    94,
  );
});

test("native selection handles resize through one kernel history entry", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  kernel.setSelection(["rectangle-portability"]);
  const interaction = new CraftySelectionInteraction(kernel);
  const initialBytes = kernel.serialize();

  interaction.handle({ phase: "down", pointerId: 1, x: 304, y: 216 });
  assert.equal(kernel.getState().interaction.resizeHandle, "se");
  interaction.handle({ phase: "move", pointerId: 1, x: 344, y: 236 });
  interaction.handle({ phase: "up", pointerId: 1, x: 344, y: 236 });

  assert.deepEqual(kernel.getDocument().nodes["rectangle-portability"].bounds, {
    height: 152,
    width: 280,
    x: 64,
    y: 84,
  });
  assert.equal(kernel.undo(), true);
  assert.equal(kernel.serialize(), initialBytes);
  assert.equal(kernel.canUndo(), false);
});

test("native rotation previews are absolute and undo as one gesture", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  kernel.setSelection(["rectangle-portability"]);
  const interaction = new CraftySelectionInteraction(kernel);
  const initialBytes = kernel.serialize();
  const center = { x: 184, y: 150 };
  const start = { x: 318.1421356237, y: 230.1421356237 };
  const vector = { x: start.x - center.x, y: start.y - center.y };
  const mid = {
    x: center.x + (vector.x - vector.y) / Math.sqrt(2),
    y: center.y + (vector.x + vector.y) / Math.sqrt(2),
  };
  const end = { x: center.x - vector.y, y: center.y + vector.x };

  interaction.handle({ phase: "down", pointerId: 1, ...start });
  assert.equal(kernel.getState().interaction.rotate, true);
  interaction.handle({ phase: "move", pointerId: 1, ...mid });
  interaction.handle({ phase: "move", pointerId: 1, ...end });
  interaction.handle({ phase: "up", pointerId: 1, ...end });

  const transform =
    kernel.getDocument().nodes["rectangle-portability"].transform;
  assert.ok(
    Math.abs(Math.atan2(transform.b, transform.a) - Math.PI / 2) < 1e-9,
  );
  const frame = JSON.parse(
    serializeCraftyNativeFrame(kernel, {
      height: 800,
      pixelRatio: 2,
      width: 1_000,
    }),
  );
  const handle = frame.commands.find(
    (command) => command.nodeId === "selection-handle-se-outer",
  );
  assert.ok(Math.abs(handle.transform.b - 1) < 1e-9);
  assert.equal(kernel.undo(), true);
  assert.equal(kernel.serialize(), initialBytes);
  assert.equal(kernel.canUndo(), false);
});

test("cancelled native resize and rotation restore exact canonical bytes", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const gestures = [
    {
      down: { x: 304, y: 216 },
      move: { x: 344, y: 236 },
    },
    {
      down: { x: 318.1421356237, y: 230.1421356237 },
      move: { x: 103.8578643763, y: 284.1421356237 },
    },
  ];
  for (const gesture of gestures) {
    const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
    kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
    kernel.setSelection(["rectangle-portability"]);
    const interaction = new CraftySelectionInteraction(kernel);
    const initialBytes = kernel.serialize();
    interaction.handle({ phase: "down", pointerId: 1, ...gesture.down });
    interaction.handle({ phase: "move", pointerId: 1, ...gesture.move });
    interaction.handle({ phase: "cancel", pointerId: 1, ...gesture.move });
    assert.equal(kernel.serialize(), initialBytes);
    assert.equal(kernel.canUndo(), false);
  }
});

test("cancelled native drag restores exact canonical bytes", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  const interaction = new CraftySelectionInteraction(kernel);
  const initialBytes = kernel.serialize();

  interaction.handle({ phase: "down", pointerId: 1, x: 100, y: 100 });
  interaction.handle({ phase: "move", pointerId: 1, x: 150, y: 140 });
  interaction.handle({ phase: "cancel", pointerId: 1, x: 150, y: 140 });

  assert.equal(kernel.serialize(), initialBytes);
  assert.equal(kernel.canUndo(), false);
});

test("native creation tools share reducer and kernel shape semantics", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const cases = [
    { tool: "rectangle", kind: "rectangle", name: "New rectangle" },
    { tool: "ellipse", kind: "path", name: "Ellipse" },
    { tool: "line", kind: "path", name: "Line" },
  ];

  for (const entry of cases) {
    const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
    kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
    kernel.setCreationFill("#123456");
    kernel.setCreationStroke("#abcdef");
    const interaction = new CraftyCreationInteraction(kernel, entry.tool);
    interaction.handle({ phase: "down", pointerId: 1, x: 400, y: 300 });
    kernel.setCreationFill("#654321");
    kernel.setCreationStroke("#fedcba");
    interaction.handle({ phase: "move", pointerId: 1, x: 520, y: 380 });
    const preview = JSON.parse(
      serializeCraftyNativeFrame(kernel, {
        height: 800,
        pixelRatio: 2,
        width: 1_000,
      }),
    );
    assert.ok(preview.commands.some((command) => command.nodeId === "preview"));
    interaction.handle({ phase: "up", pointerId: 1, x: 520, y: 380 });

    const nodeId = kernel.getState().selectedIds[0];
    const node = kernel.getDocument().nodes[nodeId];
    assert.equal(node.kind, entry.kind);
    assert.equal(node.name, entry.name);
    assert.equal(node.fill, "#123456");
    assert.equal(node.stroke, "#abcdef");
    assert.equal(kernel.getHistoryDepths().undo, 1);

    const frame = JSON.parse(
      serializeCraftyNativeFrame(kernel, {
        height: 800,
        pixelRatio: 2,
        width: 1_000,
      }),
    );
    assert.ok(frame.commands.some((command) => command.nodeId === nodeId));
    if (entry.kind === "path") {
      assert.ok(
        frame.commands.some(
          (command) => command.nodeId === nodeId && command.geometry === "path",
        ),
      );
    }

    assert.equal(kernel.undo(), true);
    assert.equal(kernel.getDocument().nodes[nodeId], undefined);
    assert.equal(kernel.canUndo(), false);
  }
});

test("native frame creation absorbs contained roots and cancellation authors nothing", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  const before = kernel.serialize();

  const cancelled = new CraftyCreationInteraction(kernel, "ellipse");
  cancelled.handle({ phase: "down", pointerId: 1, x: 400, y: 300 });
  cancelled.handle({ phase: "move", pointerId: 1, x: 520, y: 380 });
  cancelled.handle({ phase: "cancel", pointerId: 1, x: 520, y: 380 });
  assert.equal(kernel.serialize(), before);
  assert.equal(kernel.canUndo(), false);

  const interaction = new CraftyCreationInteraction(kernel, "frame");
  interaction.handle({ phase: "down", pointerId: 2, x: 40, y: 60 });
  interaction.handle({ phase: "move", pointerId: 2, x: 340, y: 240 });
  interaction.handle({ phase: "up", pointerId: 2, x: 340, y: 240 });
  const frameId = kernel.getState().selectedIds[0];
  assert.deepEqual(kernel.getDocument().nodes[frameId].childIds, [
    "rectangle-portability",
  ]);
  assert.deepEqual(kernel.getDocument().nodes["rectangle-portability"].bounds, {
    x: 24,
    y: 24,
    width: 240,
    height: 132,
  });
  assert.equal(kernel.getHistoryDepths().undo, 1);
  assert.equal(kernel.undo(), true);
  assert.equal(kernel.serialize(), before);
});

test("accessibility operates the selected rectangle through kernel commands", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });

  assert.equal(
    applyCraftyAccessibilityCommand(
      kernel,
      "rectangle-portability",
      "activate",
    ),
    true,
  );
  assert.deepEqual(kernel.getState().selectedIds, ["rectangle-portability"]);
  assert.equal(
    applyCraftyAccessibilityCommand(
      kernel,
      "rectangle-portability",
      "increment",
    ),
    true,
  );
  assert.equal(
    kernel.getDocument().nodes["rectangle-portability"].bounds.x,
    65,
  );
  assert.equal(
    applyCraftyAccessibilityCommand(
      kernel,
      "rectangle-portability",
      "decrement",
    ),
    true,
  );
  assert.equal(
    kernel.getDocument().nodes["rectangle-portability"].bounds.x,
    64,
  );
});

test("native modifier payload drives additive selection and multi-selection chrome", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  const secondId = kernel.createShape({
    tool: "rectangle",
    bounds: { x: 400, y: 84, width: 120, height: 132 },
  });
  kernel.setSelection(["rectangle-portability"]);
  const interaction = new CraftySelectionInteraction(kernel);

  interaction.handle({
    phase: "down",
    pointerId: 1,
    shiftKey: true,
    x: 460,
    y: 150,
  });
  interaction.handle({
    phase: "up",
    pointerId: 1,
    shiftKey: true,
    x: 460,
    y: 150,
  });

  assert.deepEqual(kernel.getState().selectedIds, [
    "rectangle-portability",
    secondId,
  ]);
  const frame = JSON.parse(
    serializeCraftyNativeFrame(kernel, {
      height: 800,
      pixelRatio: 2,
      width: 1_000,
    }),
  );
  assert.deepEqual(
    frame.commands.find((command) => command.nodeId === "selection-outline-top")
      .bounds,
    {
      x: 62.5,
      y: 82.5,
      width: 459,
      height: 1.5,
    },
  );
  assert.deepEqual(
    frame.commands.find(
      (command) => command.nodeId === "selection-handle-se-outer",
    ).bounds,
    {
      x: 516,
      y: 212,
      width: 8,
      height: 8,
    },
  );
});

test("native marquee selects through kernel semantics without authoring bytes", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  const secondId = kernel.createShape({
    tool: "rectangle",
    bounds: { x: 400, y: 84, width: 120, height: 132 },
  });
  kernel.setSelection([]);
  const before = kernel.serialize();
  const interaction = new CraftySelectionInteraction(kernel);

  interaction.handle({ phase: "down", pointerId: 1, x: 20, y: 40 });
  interaction.handle({ phase: "move", pointerId: 1, x: 550, y: 240 });
  const preview = JSON.parse(
    serializeCraftyNativeFrame(kernel, {
      height: 800,
      pixelRatio: 2,
      width: 1_000,
    }),
  );
  assert.ok(preview.commands.some((command) => command.nodeId === "preview"));
  interaction.handle({ phase: "up", pointerId: 1, x: 550, y: 240 });

  assert.deepEqual(kernel.getState().selectedIds, [
    "rectangle-portability",
    secondId,
  ]);
  assert.equal(kernel.serialize(), before);
});

test("native tap counts use shared deep-selection and isolation semantics", async () => {
  const [manifest, documentEntry] = await Promise.all([
    readFixture("../assets/crafty-kernel-portability.ui/manifest.ui"),
    readFixture("../assets/crafty-kernel-portability.ui/document-1.ui"),
  ]);
  const kernel = createCraftyKernelFromUiPackage({ documentEntry, manifest });
  kernel.setViewport({ devicePixelRatio: 2, panX: 0, panY: 0, zoom: 1 });
  const frameId = kernel.createShape({
    tool: "frame",
    bounds: { x: 40, y: 60, width: 300, height: 180 },
  });
  kernel.setSelection([frameId]);
  const before = kernel.serialize();
  const interaction = new CraftySelectionInteraction(kernel);

  interaction.handle({
    clickCount: 2,
    phase: "down",
    pointerId: 1,
    x: 100,
    y: 100,
  });
  interaction.handle({
    clickCount: 2,
    phase: "up",
    pointerId: 1,
    x: 100,
    y: 100,
  });

  assert.equal(kernel.getState().isolationRootId, frameId);
  assert.deepEqual(kernel.getState().selectedIds, ["rectangle-portability"]);
  assert.equal(kernel.serialize(), before);

  interaction.handle({ phase: "down", pointerId: 2, x: 600, y: 400 });
  interaction.handle({ phase: "up", pointerId: 2, x: 600, y: 400 });
  assert.equal(kernel.getState().isolationRootId, undefined);
});
