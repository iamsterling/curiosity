import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createDefaultPageCanvas, type EditorDocument } from "@crafty/editor/kernel";
import { importPenDocument, parsePenFile, type PenImportResult } from "./index.js";

const documentOf = (result: PenImportResult): EditorDocument => {
  if (!result.ok) throw new Error("expected a successful import");
  return result.document;
};

describe("pen import basics", () => {
  it("maps a frame with absolute children into a validated current document", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [
        {
          id: "card",
          type: "frame",
          x: 10,
          y: 20,
          width: 360,
          height: 200,
          name: "Card",
          fill: "#FFFFFF",
          cornerRadius: 12,
          layout: "none",
          children: [
            { id: "header", type: "rectangle", x: 24, y: 24, width: 100, height: 40, fill: "#0F172A" },
            { id: "label", type: "text", x: 24, y: 80, width: 200, height: 32, content: "Hello", fontSize: 16, fill: "#334155" }
          ]
        }
      ]
    });
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    const document = documentOf(result);
    expect(document.schemaVersion).toBe(5);
    expect(document.pageOrder).toEqual(["page-pen-canvas"]);
    expect(Object.keys(document.pages)).toHaveLength(1);
    const page = document.pages["page-pen-canvas"]!;
    expect(page.name).toBe("Imported canvas");
    expect(page.canvas).toEqual(createDefaultPageCanvas());
    const root = document.nodes[page.rootId]!;
    expect(root.kind).toBe("page-root");
    expect(root.childIds).toEqual(["card"]);
    expect(root.bounds).toEqual({ x: 10, y: 20, width: 360, height: 200 });
    const card = document.nodes["card"]!;
    expect(card.kind).toBe("group");
    expect(card.bounds).toEqual({ x: 10, y: 20, width: 360, height: 200 });
    expect(card.fill).toBe("#FFFFFF");
    expect(card.cornerRadius).toBe(12);
    expect(card.childIds).toEqual(["header", "label"]);
    const header = document.nodes["header"]!;
    expect(header.bounds).toEqual({ x: 34, y: 44, width: 100, height: 40 });
    const label = document.nodes["label"]!;
    expect(label.kind).toBe("text");
    expect(label.text).toBe("Hello");
    expect(label.bounds).toEqual({ x: 34, y: 100, width: 200, height: 32 });
    expect(document.metadata.legacyFrameStories).toEqual({ "pen-canvas": [] });
  });

  it("sizes auto text from content and font size", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [{ id: "note", type: "text", x: 0, y: 0, content: "Short label", fontSize: 14 }]
    });
    expect(result.ok).toBe(true);
    const node = documentOf(result).nodes["note"]!;
    expect(node.kind).toBe("text");
    expect(node.bounds.width).toBeGreaterThan(20);
    expect(node.bounds.height).toBeCloseTo(17.5, 5);
  });

  it("marks unsupported node types and approximates ellipses with diagnostics", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [
        { id: "star", type: "path", x: 0, y: 0, width: 50, height: 50, geometry: "M0 0 L50 50" },
        { id: "avatar", type: "ellipse", x: 100, y: 0, width: 40, height: 40, fill: "#0EA5E9" },
        { id: "note", type: "note", x: 200, y: 0, content: "hi" },
        { id: "ok", type: "icon", x: 0, y: 100, icon: "check" }
      ]
    });
    expect(result.ok).toBe(true);
    const codes = result.diagnostics.map((item) => item.code);
    expect(codes).toContain("PEN_NODE_UNSUPPORTED");
    expect(codes).toContain("PEN_ELLIPSE_APPROXIMATED");
    const document = documentOf(result);
    expect(document.nodes["avatar"]).toBeDefined();
    expect(document.nodes["avatar"]!.kind).toBe("rectangle");
    expect(document.nodes["star"]).toBeUndefined();
  });

  it("rejects malformed documents with diagnostics", () => {
    const wrongVersion = importPenDocument({ version: "2.13", children: [] });
    expect(wrongVersion.ok).toBe(false);
    if (!wrongVersion.ok) expect(wrongVersion.diagnostics.map((item) => item.code)).toContain("PEN_DOCUMENT_INVALID");
    expect(importPenDocument({ version: "2.14" }).ok).toBe(false);
    expect(importPenDocument({ version: "2.14", children: [{ id: "a", type: "rectangle" }, { id: "a", type: "rectangle" }] }).ok).toBe(false);
    expect(parsePenFile("{ not json").diagnostics.map((item) => item.code)).toContain("PEN_JSON_INVALID");
  });

  it("fails with PEN_SCENE_INVALID when the imported scene is invalid", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [{ id: "big", type: "rectangle", x: 0, y: 0, width: 10, height: 10, name: "n".repeat(600) }]
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics.map((item) => item.code)).toContain("PEN_SCENE_INVALID");
  });

  it("surfaces adapter failures as PEN_DOCUMENT_INVALID with the thrown message", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [{ id: "page-root-pen-canvas", type: "rectangle", x: 0, y: 0, width: 10, height: 10 }]
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result.diagnostics.find((item) => item.code === "PEN_DOCUMENT_INVALID");
      expect(failure).toBeDefined();
      expect(failure!.message).toContain("EDITOR_DOCUMENT_DUPLICATE_NODE");
    }
  });
});

describe("pen import variables and themes", () => {
  it("resolves variables with theme-selected values", () => {
    const result = importPenDocument({
      version: "2.14",
      themes: { mode: ["light", "dark"] },
      variables: {
        "color.bg": { type: "color", value: [{ value: "#FFFFFF", theme: { mode: "light" } }, { value: "#0B1220", theme: { mode: "dark" } }] },
        "radius.card": { type: "number", value: 16 }
      },
      children: [
        { id: "light", type: "rectangle", x: 0, y: 0, width: 100, height: 100, fill: "$color.bg", cornerRadius: "$radius.card" },
        { id: "dark", type: "rectangle", x: 120, y: 0, width: 100, height: 100, fill: "$color.bg", theme: { mode: "dark" } }
      ]
    });
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    const document = documentOf(result);
    expect(document.nodes["light"]!.fill).toBe("#FFFFFF");
    expect(document.nodes["dark"]!.fill).toBe("#0B1220");
    expect(document.nodes["light"]!.cornerRadius).toBe(16);
  });

  it("reports unresolved and circular variables", () => {
    const circular = importPenDocument({
      version: "2.14",
      variables: { "a": { type: "number", value: "$b" }, "b": { type: "number", value: "$a" } },
      children: [{ id: "box", type: "rectangle", x: 0, y: 0, width: "$a", height: 10 }]
    });
    expect(circular.diagnostics.map((item) => item.code)).toContain("PEN_VARIABLE_UNRESOLVED");
    const missing = importPenDocument({
      version: "2.14",
      children: [{ id: "box", type: "rectangle", x: 0, y: 0, width: 10, height: 10, fill: "$nope" }]
    });
    expect(missing.diagnostics.map((item) => item.code)).toContain("PEN_VARIABLE_UNRESOLVED");
    expect(documentOf(missing).nodes["box"]!.fill).toBe("#00000000");
  });
});

describe("pen import layout", () => {
  it("arranges a vertical layout with padding, gap, and fill_container sizing", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [
        {
          id: "panel",
          type: "frame",
          x: 0,
          y: 0,
          width: 300,
          height: 160,
          layout: "vertical",
          padding: [10, 20],
          gap: 8,
          fill: "#FFFFFF",
          children: [
            { id: "title", type: "text", content: "Title", fontSize: 14 },
            { id: "row", type: "rectangle", width: "fill_container", height: 40, fill: "#E2E8F0" }
          ]
        }
      ]
    });
    expect(result.ok).toBe(true);
    const document = documentOf(result);
    const panel = document.nodes["panel"]!;
    expect(panel.childIds).toEqual(["title", "row"]);
    const title = document.nodes["title"]!;
    const row = document.nodes["row"]!;
    expect(title.bounds.y).toBe(10);
    expect(title.bounds.x).toBe(20);
    expect(row.bounds.y).toBeCloseTo(10 + title.bounds.height + 8, 5);
    expect(row.bounds.width).toBeCloseTo(260, 5);
    expect(row.bounds.x).toBe(20);
  });

  it("lays a frame out horizontally by default with center alignment", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [
        {
          id: "row",
          type: "frame",
          x: 0,
          y: 0,
          width: 200,
          height: 50,
          alignItems: "center",
          gap: 10,
          children: [
            { id: "a", type: "rectangle", width: 30, height: 30, fill: "#FF0000" },
            { id: "b", type: "rectangle", width: 30, height: 30, fill: "#00FF00" }
          ]
        }
      ]
    });
    expect(result.ok).toBe(true);
    const document = documentOf(result);
    expect(document.nodes["a"]!.bounds.x).toBe(0);
    expect(document.nodes["a"]!.bounds.y).toBe(10);
    expect(document.nodes["b"]!.bounds.x).toBe(40);
  });
});

describe("pen import components and instances", () => {
  it("resolves instances with overrides and descendant customization", () => {
    const result = importPenDocument({
      version: "2.14",
      children: [
        {
          id: "round-button",
          type: "frame",
          reusable: true,
          x: 0,
          y: 0,
          width: 120,
          height: 40,
          cornerRadius: 20,
          fill: "#2563EB",
          children: [{ id: "label", type: "text", content: "Submit", fill: "#FFFFFF", fontSize: 14 }]
        },
        {
          id: "row",
          type: "frame",
          x: 0,
          y: 60,
          width: 400,
          height: 60,
          layout: "horizontal",
          gap: 16,
          children: [
            { id: "ok", type: "ref", ref: "round-button", width: 120, height: 40 },
            { id: "cancel", type: "ref", ref: "round-button", width: 120, height: 40, fill: "#DC2626", descendants: { "label": { content: "Cancel" } } }
          ]
        }
      ]
    });
    expect(result.ok).toBe(true);
    const document = documentOf(result);
    const row = document.nodes["row"]!;
    expect(row.childIds).toEqual(["ok", "cancel"]);
    const ok = document.nodes["ok"]!;
    const cancel = document.nodes["cancel"]!;
    expect(ok.childIds).toEqual(["ok__label"]);
    expect(cancel.childIds).toEqual(["cancel__label"]);
    expect(document.nodes["ok__label"]!.text).toBe("Submit");
    expect(document.nodes["cancel__label"]!.text).toBe("Cancel");
    expect(cancel.fill).toBe("#DC2626");
    expect(document.nodes["round-button"]!.childIds).toEqual(["label"]);
    expect(Object.keys(document.nodes).length).toBe(8);
  });

  it("replaces a descendant node and detects ref cycles", () => {
    const replaced = importPenDocument({
      version: "2.14",
      children: [
        {
          id: "card",
          type: "frame",
          reusable: true,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          children: [{ id: "content", type: "rectangle", width: 50, height: 50, fill: "#000000" }]
        },
        { id: "instance", type: "ref", ref: "card", x: 200, y: 0, descendants: { "content": { id: "swapped", type: "ellipse", width: 60, height: 60, fill: "#FF00FF" } } }
      ]
    });
    expect(replaced.ok).toBe(true);
    const document = documentOf(replaced);
    const instance = document.nodes["instance"]!;
    expect(instance.childIds).toEqual(["instance__swapped"]);
    const swapped = document.nodes["instance__swapped"]!;
    expect(swapped.kind).toBe("rectangle");
    expect(swapped.fill).toBe("#FF00FF");
    expect(replaced.diagnostics.some((item) => item.code === "PEN_ELLIPSE_APPROXIMATED")).toBe(true);

    const cyclic = importPenDocument({
      version: "2.14",
      children: [
        { id: "a", type: "frame", reusable: true, x: 0, y: 0, width: 50, height: 50 },
        { id: "b", type: "frame", reusable: true, x: 0, y: 0, width: 50, height: 50, children: [{ id: "ba", type: "ref", ref: "a" }] }
      ]
    });
    expect(cyclic.ok).toBe(true);
  });
});

describe("sample pen file", () => {
  it("imports the pen.dev generated sample card", async () => {
    const source = await readFile(new URL("../../../test-workspaces/pen/sample-card.pen", import.meta.url), "utf8");
    const result = parsePenFile(source);
    expect(result.ok).toBe(true);
    const document = documentOf(result);
    expect(document.schemaVersion).toBe(5);
    expect(document.pageOrder).toHaveLength(1);
    const root = document.nodes[document.pages[document.pageOrder[0]!]!.rootId]!;
    expect(root.childIds.length).toBeGreaterThan(0);
    const card = document.nodes["lI3YO"]!;
    expect(card.kind).toBe("group");
    expect(card.bounds.width).toBeGreaterThan(0);
    expect(card.childIds.length).toBeGreaterThan(0);
  });
});
