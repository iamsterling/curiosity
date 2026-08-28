import { describe, expect, it } from "vitest";
import { parsePort, resolveFace } from "./faces.js";

describe("crafty face resolution", () => {
  it("runs the desktop face by default", () => {
    expect(resolveFace([]).face).toBe("desktop");
  });

  it("routes the serve face", () => {
    expect(resolveFace(["serve"]).face).toBe("serve");
    expect(resolveFace(["serve", "--port", "5000"]).args).toEqual(["--port", "5000"]);
  });

  it("routes the pen import face", () => {
    const resolved = resolveFace(["import", "designs/card.pen"]);
    expect(resolved.face).toBe("import");
    expect(resolved.args).toEqual(["designs/card.pen"]);
  });

  it("routes the save and load faces with their args", () => {
    const save = resolveFace(["save", "alpha", "out/alpha.ui"]);
    expect(save.face).toBe("save");
    expect(save.args).toEqual(["alpha", "out/alpha.ui"]);
    const load = resolveFace(["load", "beta"]);
    expect(load.face).toBe("load");
    expect(load.args).toEqual(["beta"]);
  });

  it("treats --help as usage and unknown commands as usage errors", () => {
    expect(resolveFace(["--help"]).face).toBe("usage");
    expect(resolveFace(["-h"]).face).toBe("usage");
    expect(resolveFace(["frobnicate"]).face).toBe("usage-error");
  });

  it("routes --port flags on the bare command to the desktop face", () => {
    expect(resolveFace(["--port", "5000"]).face).toBe("desktop");
    expect(resolveFace(["--port=5000"]).face).toBe("desktop");
  });
});

describe("port parsing", () => {
  it("accepts --port N and --port=N within range", () => {
    expect(parsePort(["--port", "8080"])).toBe(8080);
    expect(parsePort(["--port=3000"])).toBe(3000);
    expect(parsePort([])).toBe(4173);
  });

  it("rejects out-of-range and malformed values", () => {
    expect(parsePort(["--port", "0"])).toBeUndefined();
    expect(parsePort(["--port", "70000"])).toBeUndefined();
    expect(parsePort(["--port", "abc"])).toBeUndefined();
    expect(parsePort(["--port"])).toBeUndefined();
  });
});
