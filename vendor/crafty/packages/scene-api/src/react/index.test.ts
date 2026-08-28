import { describe, expect, it } from "vitest";
import React from "react";
import { SceneGroup, SceneRect, descriptionFromChildren } from "./index.js";

describe("scene-api React binding", () => {
  it("builds serializable descriptions without mounting a DOM", () => {
    const canvas = { id: "react-test", width: 100, height: 100, pixelRatio: 1, background: [0, 0, 0, 1] as [number, number, number, number] };
    const description = descriptionFromChildren(canvas, React.createElement(SceneGroup, { id: "g", opacity: 0.5 }, React.createElement(SceneRect, { id: "r", bounds: { x: 0, y: 0, width: 10, height: 10 }, fill: [1, 0, 0, 1] })));
    expect(JSON.parse(JSON.stringify(description))).toEqual(description);
    expect(description.children[0]).toMatchObject({ kind: "group", id: "g", children: [{ kind: "rect", id: "r" }] });
  });
});
