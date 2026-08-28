import { describe, expect, it } from "vitest";
import type { RenderFrame } from "@crafty/scene-renderer";
import { initWasm, RendererCore } from "@crafty/scene-renderer/wasm";
import { serializeRenderPacket } from "@crafty/scene-renderer/wasm";
import { readRendererWasm } from "./renderer-wasm.js";
import {
  createParityFixtures,
  PARITY_FIXTURE_NAMES,
  type EncodeEvidence,
  type ParityFixtureName,
} from "./parity-fixtures.js";
import {
  assertParity,
  compareParity,
  ENCODE_REFERENCE_MISSING,
  PARITY_MISMATCH,
  PARITY_REFERENCES,
  referenceFor,
} from "./parity-references.js";

/**
 * Encode-level parity harness (openspec change vector-path-rendering,
 * tasks 7.1–7.2): the committed fixtures encode through the compiled wasm
 * module's `encode_frame` — GPU-less, headless — and must match their
 * recorded references. The harness fails loudly when a reference is missing
 * (referenceFor throws), so a fixture added without a reference cannot pass
 * vacuously.
 */

const loadWasm = async (): Promise<void> => {
  await initWasm({ module_or_path: readRendererWasm() });
};

const encodeEvidence = (core: RendererCore, frame: RenderFrame): EncodeEvidence =>
  JSON.parse(core.encode_frame(serializeRenderPacket(frame))) as EncodeEvidence;

describe("encode-level parity through the compiled module (7.1)", () => {
  it.each(PARITY_FIXTURE_NAMES)("%s encodes to its recorded reference", async (name) => {
    await loadWasm();
    const core = new RendererCore();
    const fixtures = createParityFixtures();
    assertParity(name, encodeEvidence(core, fixtures[name]));
  }, 30_000);

  it("is deterministic across runs for every fixture (fingerprint equality)", async () => {
    await loadWasm();
    const core = new RendererCore();
    const fixtures = createParityFixtures();
    for (const name of PARITY_FIXTURE_NAMES) {
      const first = encodeEvidence(core, fixtures[name]);
      const second = encodeEvidence(core, fixtures[name]);
      expect(second.fingerprint).toBe(first.fingerprint);
      expect(second.paths).toBe(first.paths);
      expect(second.segments).toBe(first.segments);
      // And the reference agrees with both runs.
      assertParity(name, first);
    }
  }, 60_000);
});

describe("missing or stale references fail loudly (7.2)", () => {
  it("referenceFor throws ENCODE_REFERENCE_MISSING for a fixture with no recorded reference", () => {
    expect(() => referenceFor("unrecorded-fixture" as ParityFixtureName)).toThrow(
      new RegExp(`${ENCODE_REFERENCE_MISSING}:unrecorded-fixture`),
    );
  });

  it("assertParity fails with the coded error when the reference is absent", () => {
    expect(() => assertParity("unrecorded-fixture" as ParityFixtureName, {
      bytes: 0,
      fingerprint: "0".repeat(16),
      paths: 0,
      segments: 0,
    })).toThrow(new RegExp(`${ENCODE_REFERENCE_MISSING}:unrecorded-fixture`));
  });

  it("every fixture has a recorded reference and every reference names a fixture", () => {
    for (const name of PARITY_FIXTURE_NAMES) {
      expect(referenceFor(name)).toBeDefined();
    }
    expect(Object.keys(PARITY_REFERENCES)).toEqual([...PARITY_FIXTURE_NAMES]);
  });

  it("a stale reference fails the harness (PARITY_MISMATCH) rather than passing", () => {
    const stale: EncodeEvidence = {
      bytes: 1,
      fingerprint: "0000000000000000",
      paths: 1,
      segments: 1,
    };
    expect(() => compareParity("representative", stale, referenceFor("representative"))).toThrow(
      new RegExp(`${PARITY_MISMATCH}:representative:fingerprint`),
    );
  });
});

/**
 * Reference-recording tool, not a CI assertion. Re-recording a reference is
 * an explicit, isolated act that changes nothing else (spec + task 7.3's
 * procedure, `benchmarks/pixel-parity-recording.md`); run it when a
 * dependency bump or a deliberate encoder change invalidates the committed
 * references, then transcribe the printed lines into
 * `parity-references.ts` in a commit containing nothing else:
 *
 *   CRAFTY_RECORD_PARITY_REFERENCES=1 npx vitest run benchmarks/encode-parity.test.ts
 */
const shouldRecord = process.env.CRAFTY_RECORD_PARITY_REFERENCES === "1";

describe.skipIf(!shouldRecord)("parity reference recording (explicit, isolated act)", () => {
  it("prints the recorded environment and one reference line per fixture", async () => {
    await loadWasm();
    const core = new RendererCore();
    const fixtures = createParityFixtures();
    console.info("PARITY_REFERENCE_ENVIRONMENT: macOS 27.0 (26A5368g), arm64, Apple M5 (10 cores); rustc 1.97.1 pinned toolchain; wasm-bindgen 0.2.126; release profile (opt-level=3, lto=fat, codegen-units=1, strip); vello 0.9.0, vello_encoding 0.9.0, wgpu 29.0.4");
    for (const name of PARITY_FIXTURE_NAMES) {
      const evidence = encodeEvidence(core, fixtures[name]);
      console.info(`PARITY_REFERENCE_${name}=${evidence.fingerprint} paths=${evidence.paths} segments=${evidence.segments} bytes=${evidence.bytes}`);
    }
  }, 60_000);
});
